import {
  decodeEventLog,
  getAddress,
  type Address,
  type Hex,
  type Log,
  type TransactionReceipt,
} from "viem";
import { boardingPassAbi } from "./abi/boardingPass";

export class BoardingPassMintedLogNotFoundError extends Error {
  constructor() {
    super("BoardingPassMinted log not found");
    this.name = "BoardingPassMintedLogNotFoundError";
  }
}

export type BoardingPassMintedDecoded = {
  traveler: Address;
  tokenId: number;
  seatId: number;
  totalPaid: bigint;
  bagCount: number;
  vesselCraftId: number;
  vesselEntry: number;
};

function asNumber(value: bigint, label: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds safe integer range`);
  }
  return Number(value);
}

export function decodeBoardingPassMinted(
  receipt: Pick<TransactionReceipt, "logs"> | { logs: readonly Log[] },
  contractAddress: Address,
): BoardingPassMintedDecoded {
  const expected = getAddress(contractAddress);
  for (const log of receipt.logs) {
    if (getAddress(log.address) !== expected) {
      continue;
    }
    try {
      const parsed = decodeEventLog({
        abi: boardingPassAbi,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
      });
      if (parsed.eventName !== "BoardingPassMinted") {
        continue;
      }
      return {
        traveler: parsed.args.traveler,
        tokenId: asNumber(parsed.args.tokenId, "tokenId"),
        seatId: Number(parsed.args.seatId),
        totalPaid: parsed.args.totalPaid,
        bagCount: Number(parsed.args.bagCount),
        vesselCraftId: asNumber(parsed.args.vesselCraftId, "vesselCraftId"),
        vesselEntry: asNumber(parsed.args.vesselEntry, "vesselEntry"),
      };
    } catch {
      continue;
    }
  }
  throw new BoardingPassMintedLogNotFoundError();
}
