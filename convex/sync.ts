"use node";

import { v } from "convex/values";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { boardingPassAbi } from "./lib/abi";
import { decodeMintedLogs, mintedEventAbi } from "./lib/decodeMinted";
import { nextBlockRange, confirmedHead } from "./lib/mints";
import { rpcUrlForChain, syncStartBlock } from "./lib/rpc";
import { withRetry } from "./lib/retry";
import { assertAddress, assertTxHash } from "./lib/ids";

function clientFor(chainId: number) {
  return createPublicClient({
    transport: http(rpcUrlForChain(chainId)),
  });
}

export const verifyMint = internalAction({
  args: {
    chainId: v.number(),
    contractAddress: v.string(),
    txHash: v.string(),
    tokenId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contractAddress = assertAddress(args.contractAddress);
    const txHash = assertTxHash(args.txHash) as Hex;
    const publicClient = clientFor(args.chainId);
    const receipt = await withRetry(() =>
      publicClient.getTransactionReceipt({ hash: txHash }),
    );
    if (receipt.status !== "success") {
      throw new Error("Transaction did not succeed");
    }
    const minted = decodeMintedLogs(receipt.logs, contractAddress);
    const match = minted.find((event) => Number(event.tokenId) === args.tokenId);
    if (!match) {
      throw new Error("BoardingPassMinted log not found");
    }
    const pass = await publicClient.readContract({
      address: contractAddress as Address,
      abi: boardingPassAbi,
      functionName: "getBoardingPass",
      args: [BigInt(args.tokenId)],
    });
    const block = await publicClient.getBlock({
      blockNumber: receipt.blockNumber,
    });
    await ctx.runMutation(internal.mints.applyVerifiedMint, {
      chainId: args.chainId,
      contractAddress,
      tokenId: args.tokenId,
      txHash,
      seatId: Number(pass.seatId),
      travelerAddress: pass.traveler,
      fullName: pass.fullName,
      dateOfBirthUint32: pass.dateOfBirth,
      twitterHandle: pass.twitterHandle,
      bagCount: Number(pass.bagCount),
      totalPaidWei: pass.totalPaid.toString(10),
      blockNumber: Number(receipt.blockNumber),
      blockTimestamp: Number(block.timestamp),
      vesselCraftId: Number(pass.vesselCraftId),
      vesselEntry: Number(pass.vesselEntry),
    });
    return null;
  },
});

export const reconcile = internalAction({
  args: {},
  returns: v.object({
    processed: v.number(),
    ranges: v.number(),
  }),
  handler: async (ctx) => {
    let cursors = await ctx.runQuery(internal.syncState.listCursors, {});
    const envChain = process.env.BOARDING_PASS_CHAIN_ID;
    const envAddress = process.env.BOARDING_PASS_ADDRESS;
    if (cursors.length === 0 && envChain && envAddress) {
      const chainId = Number.parseInt(envChain, 10);
      await ctx.runMutation(internal.syncState.ensureCursor, {
        chainId,
        contractAddress: assertAddress(envAddress),
        startBlock: syncStartBlock(),
      });
      cursors = await ctx.runQuery(internal.syncState.listCursors, {});
    }

    let processed = 0;
    let ranges = 0;
    const event = mintedEventAbi();
    for (const cursor of cursors) {
      const publicClient = clientFor(cursor.chainId);
      const head = await publicClient.getBlockNumber();
      const confirmed = confirmedHead(head, cursor.chainId);
      const range = nextBlockRange(cursor.lastProcessedBlock, confirmed);
      if (!range) {
        await ctx.runMutation(internal.syncState.advanceCursor, {
          chainId: cursor.chainId,
          contractAddress: cursor.contractAddress,
          lastProcessedBlock: cursor.lastProcessedBlock,
          lastConfirmedBlock: confirmed,
        });
        continue;
      }
      ranges += 1;
      const logs = await withRetry(() =>
        publicClient.getLogs({
          address: cursor.contractAddress as Address,
          event,
          fromBlock: BigInt(range.fromBlock),
          toBlock: BigInt(range.toBlock),
        }),
      );
      const minted = decodeMintedLogs(logs, cursor.contractAddress);
      for (const mintedEvent of minted) {
        const tokenId = Number(mintedEvent.tokenId);
        const pass = await publicClient.readContract({
          address: cursor.contractAddress as Address,
          abi: boardingPassAbi,
          functionName: "getBoardingPass",
          args: [mintedEvent.tokenId],
        });
        const block = await publicClient.getBlock({
          blockNumber: mintedEvent.blockNumber,
        });
        await ctx.runMutation(internal.mints.applyVerifiedMint, {
          chainId: cursor.chainId,
          contractAddress: cursor.contractAddress,
          tokenId,
          txHash: mintedEvent.txHash,
          seatId: Number(pass.seatId),
          travelerAddress: pass.traveler,
          fullName: pass.fullName,
          dateOfBirthUint32: pass.dateOfBirth,
          twitterHandle: pass.twitterHandle,
          bagCount: Number(pass.bagCount),
          totalPaidWei: pass.totalPaid.toString(10),
          blockNumber: Number(mintedEvent.blockNumber),
          blockTimestamp: Number(block.timestamp),
          vesselCraftId: Number(pass.vesselCraftId),
          vesselEntry: Number(pass.vesselEntry),
        });
        processed += 1;
      }
      await ctx.runMutation(internal.syncState.advanceCursor, {
        chainId: cursor.chainId,
        contractAddress: cursor.contractAddress,
        lastProcessedBlock: range.toBlock,
        lastConfirmedBlock: confirmed,
      });
    }
    return { processed, ranges };
  },
});
