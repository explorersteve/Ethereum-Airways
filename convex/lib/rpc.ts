export function rpcUrlForChain(chainId: number): string {
  const specific = process.env[`RPC_URL_${chainId}`];
  if (specific && specific.length > 0) {
    return specific;
  }
  const fallback = process.env.INDEXER_RPC_URL;
  if (fallback && fallback.length > 0) {
    return fallback;
  }
  throw new Error(
    `Missing Convex env RPC_URL_${chainId} or INDEXER_RPC_URL`,
  );
}

export function syncStartBlock(): number {
  const raw = process.env.BOARDING_PASS_START_BLOCK;
  if (!raw) {
    return 0;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("Invalid BOARDING_PASS_START_BLOCK");
  }
  return parsed;
}
