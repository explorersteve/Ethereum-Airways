import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { assertAddress, assertTxHash } from "./lib/ids";
import { mintListItem, mintUi } from "./lib/validators";
import { seatById, seatExists } from "./lib/seats";
import { uint32ToIso } from "./lib/passenger";
import { writeSeatMinted } from "./lib/seatIndexWrite";

export const recordMint = mutation({
  args: {
    chainId: v.number(),
    contractAddress: v.string(),
    txHash: v.string(),
    tokenId: v.number(),
  },
  returns: v.id("mints"),
  handler: async (ctx, args) => {
    const contractAddress = assertAddress(args.contractAddress);
    const txHash = assertTxHash(args.txHash);
    if (!Number.isInteger(args.chainId) || args.chainId <= 0) {
      throw new Error("Invalid chain id");
    }
    if (!Number.isInteger(args.tokenId) || args.tokenId <= 0) {
      throw new Error("Invalid token id");
    }
    const existing = await ctx.db
      .query("mints")
      .withIndex("by_chain_contract_token", (q) =>
        q
          .eq("chainId", args.chainId)
          .eq("contractAddress", contractAddress)
          .eq("tokenId", args.tokenId),
      )
      .unique();
    if (existing?.status === "verified") {
      await ctx.scheduler.runAfter(0, internal.sync.verifyMint, {
        chainId: args.chainId,
        contractAddress,
        txHash: existing.txHash,
        tokenId: args.tokenId,
      });
      return existing._id;
    }
    const now = Date.now();
    let mintId = existing?._id;
    if (existing) {
      await ctx.db.patch("mints", existing._id, { txHash });
    } else {
      mintId = await ctx.db.insert("mints", {
        chainId: args.chainId,
        contractAddress,
        tokenId: args.tokenId,
        txHash,
        status: "pending",
        createdAt: now,
      });
    }
    await ctx.scheduler.runAfter(0, internal.sync.verifyMint, {
      chainId: args.chainId,
      contractAddress,
      txHash,
      tokenId: args.tokenId,
    });
    if (!mintId) {
      throw new Error("Failed to record mint");
    }
    return mintId;
  },
});

export const applyVerifiedMint = internalMutation({
  args: {
    chainId: v.number(),
    contractAddress: v.string(),
    tokenId: v.number(),
    txHash: v.string(),
    seatId: v.number(),
    travelerAddress: v.string(),
    fullName: v.string(),
    dateOfBirthUint32: v.number(),
    twitterHandle: v.string(),
    bagCount: v.number(),
    totalPaidWei: v.string(),
    blockNumber: v.number(),
    blockTimestamp: v.number(),
    vesselCraftId: v.number(),
    vesselEntry: v.number(),
  },
  returns: v.id("mints"),
  handler: async (ctx, args) => {
    if (!seatExists(args.seatId)) {
      throw new Error(`Invalid seat: ${args.seatId}`);
    }
    const seat = seatById(args.seatId);
    if (!seat) {
      throw new Error(`Invalid seat: ${args.seatId}`);
    }
    const contractAddress = assertAddress(args.contractAddress);
    const txHash = assertTxHash(args.txHash);
    const travelerAddress = assertAddress(args.travelerAddress);
    const dateOfBirthISO = uint32ToIso(args.dateOfBirthUint32);
    const existing = await ctx.db
      .query("mints")
      .withIndex("by_chain_contract_token", (q) =>
        q
          .eq("chainId", args.chainId)
          .eq("contractAddress", contractAddress)
          .eq("tokenId", args.tokenId),
      )
      .unique();
    const now = Date.now();
    const fields = {
      chainId: args.chainId,
      contractAddress,
      tokenId: args.tokenId,
      txHash,
      status: "verified" as const,
      seatId: args.seatId,
      seatLabel: seat.label,
      cabin: seat.cabin,
      seatPosition: seat.position,
      travelerAddress,
      fullName: args.fullName,
      dateOfBirthISO,
      twitterHandle: args.twitterHandle,
      bagCount: args.bagCount,
      totalPaidWei: args.totalPaidWei,
      blockNumber: args.blockNumber,
      blockTimestamp: args.blockTimestamp,
      vesselCraftId: args.vesselCraftId,
      vesselEntry: args.vesselEntry,
    };
    let mintId = existing?._id;
    if (existing) {
      await ctx.db.patch("mints", existing._id, fields);
    } else {
      mintId = await ctx.db.insert("mints", {
        ...fields,
        createdAt: now,
      });
    }
    if (!mintId) {
      throw new Error("Failed to upsert verified mint");
    }
    await writeSeatMinted(ctx, {
      seatId: args.seatId,
      ownerAddress: travelerAddress,
      tokenId: args.tokenId,
      txHash,
      blockNumber: args.blockNumber,
    });
    return mintId;
  },
});

export const getMintByTokenId = query({
  args: {
    chainId: v.number(),
    contractAddress: v.string(),
    tokenId: v.number(),
  },
  returns: v.union(mintUi, v.null()),
  handler: async (ctx, args) => {
    const contractAddress = assertAddress(args.contractAddress);
    const mint = await ctx.db
      .query("mints")
      .withIndex("by_chain_contract_token", (q) =>
        q
          .eq("chainId", args.chainId)
          .eq("contractAddress", contractAddress)
          .eq("tokenId", args.tokenId),
      )
      .unique();
    if (!mint) {
      return null;
    }
    return {
      chainId: mint.chainId,
      contractAddress: mint.contractAddress,
      tokenId: mint.tokenId,
      txHash: mint.txHash,
      status: mint.status,
      seatId: mint.seatId,
      seatLabel: mint.seatLabel,
      cabin: mint.cabin,
      seatPosition: mint.seatPosition,
      travelerAddress: mint.travelerAddress,
      fullName: mint.fullName,
      dateOfBirthISO: mint.dateOfBirthISO,
      twitterHandle: mint.twitterHandle,
      bagCount: mint.bagCount,
      totalPaidWei: mint.totalPaidWei,
      vesselCraftId: mint.vesselCraftId,
      vesselEntry: mint.vesselEntry,
    };
  },
});

export const listMintsByOwner = query({
  args: { travelerAddress: v.string() },
  returns: v.array(mintListItem),
  handler: async (ctx, args) => {
    const travelerAddress = assertAddress(args.travelerAddress);
    const rows = await ctx.db
      .query("mints")
      .withIndex("by_travelerAddress", (q) =>
        q.eq("travelerAddress", travelerAddress),
      )
      .take(50);
    return rows
      .filter((row) => row.status === "verified")
      .map((row) => ({
        chainId: row.chainId,
        contractAddress: row.contractAddress,
        tokenId: row.tokenId,
        txHash: row.txHash,
        seatId: row.seatId,
        seatLabel: row.seatLabel,
        cabin: row.cabin,
        vesselCraftId: row.vesselCraftId,
        vesselEntry: row.vesselEntry,
      }));
  },
});
