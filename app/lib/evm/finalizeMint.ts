import type { Address, TransactionReceipt } from "viem";
import {
  BoardingPassMintedLogNotFoundError,
  decodeBoardingPassMinted,
  type BoardingPassMintedDecoded,
} from "./receipt";

export type RecordMintArgs = {
  chainId: number;
  contractAddress: string;
  txHash: string;
  tokenId: number;
};

export type FinalizeMintResult = {
  minted: BoardingPassMintedDecoded | null;
  recorded: boolean;
  logMissing: boolean;
};

export async function finalizeMint(input: {
  receipt: TransactionReceipt;
  contractAddress: Address;
  chainId: number;
  recordMint: (args: RecordMintArgs) => Promise<unknown>;
}): Promise<FinalizeMintResult> {
  let minted: BoardingPassMintedDecoded;
  try {
    minted = decodeBoardingPassMinted(input.receipt, input.contractAddress);
  } catch (error) {
    if (error instanceof BoardingPassMintedLogNotFoundError) {
      return { minted: null, recorded: false, logMissing: true };
    }
    throw error;
  }

  try {
    await input.recordMint({
      chainId: input.chainId,
      contractAddress: input.contractAddress,
      txHash: input.receipt.transactionHash,
      tokenId: minted.tokenId,
    });
    return { minted, recorded: true, logMissing: false };
  } catch {
    return { minted, recorded: false, logMissing: false };
  }
}
