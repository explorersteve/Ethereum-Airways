export type MintIdentity = {
  chainId: number;
  contractAddress: string;
  tokenId: number;
};

export function mintIdentityKey(identity: MintIdentity): string {
  return `${identity.chainId}:${identity.contractAddress.toLowerCase()}:${identity.tokenId}`;
}

export function upsertByMintIdentity<T extends MintIdentity>(
  existing: readonly T[],
  incoming: T,
): T[] {
  const key = mintIdentityKey(incoming);
  const without = existing.filter((row) => mintIdentityKey(row) !== key);
  return [...without, incoming];
}

export const MAX_LOG_BLOCK_RANGE = 2_000;

export function confirmationBuffer(chainId: number): number {
  if (chainId === 1) return 12;
  if (chainId === 31337) return 0;
  return 8;
}

export function confirmedHead(blockNumber: bigint, chainId: number): number {
  const buffer = confirmationBuffer(chainId);
  const head = Number(blockNumber);
  return Math.max(0, head - buffer);
}

export function nextBlockRange(
  lastProcessedBlock: number,
  confirmedHeadBlock: number,
  maxRange = MAX_LOG_BLOCK_RANGE,
): { fromBlock: number; toBlock: number } | null {
  const fromBlock = lastProcessedBlock + 1;
  if (fromBlock > confirmedHeadBlock) {
    return null;
  }
  const toBlock = Math.min(confirmedHeadBlock, fromBlock + maxRange - 1);
  return { fromBlock, toBlock };
}
