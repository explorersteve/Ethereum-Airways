import {
  decodeEventLog,
  type Address,
  type Hex,
} from "viem";
import { boardingPassAbi } from "./abi";

export type MintedEvent = {
  traveler: Address;
  tokenId: bigint;
  seatId: number;
  totalPaid: bigint;
  bagCount: number;
  vesselCraftId: bigint;
  vesselEntry: bigint;
  txHash: Hex;
  blockNumber: bigint;
};

export function mintedEventAbi() {
  const event = boardingPassAbi.find(
    (item) => item.type === "event" && item.name === "BoardingPassMinted",
  );
  if (!event || event.type !== "event") {
    throw new Error("BoardingPassMinted ABI missing");
  }
  return event;
}

export function decodeMintedLogs(
  logs: readonly {
    address: Address;
    data: Hex;
    topics: readonly Hex[];
    transactionHash: Hex;
    blockNumber: bigint | null;
  }[],
  contractAddress: string,
): MintedEvent[] {
  const expected = contractAddress.toLowerCase();
  const decoded: MintedEvent[] = [];
  for (const log of logs) {
    if (log.address.toLowerCase() !== expected || log.blockNumber === null) {
      continue;
    }
    try {
      const parsed = decodeEventLog({
        abi: boardingPassAbi,
        data: log.data,
        topics: [...log.topics] as [Hex, ...Hex[]],
      });
      if (parsed.eventName !== "BoardingPassMinted") {
        continue;
      }
      decoded.push({
        traveler: parsed.args.traveler,
        tokenId: parsed.args.tokenId,
        seatId: Number(parsed.args.seatId),
        totalPaid: parsed.args.totalPaid,
        bagCount: Number(parsed.args.bagCount),
        vesselCraftId: parsed.args.vesselCraftId,
        vesselEntry: parsed.args.vesselEntry,
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      });
    } catch {
      continue;
    }
  }
  return decoded;
}
