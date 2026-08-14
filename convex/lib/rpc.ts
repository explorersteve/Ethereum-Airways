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
    throw new Error(
      "BOARDING_PASS_START_BLOCK is required; set it from deployments/<network>.json deploymentBlock",
    );
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(
      "BOARDING_PASS_START_BLOCK must be the deployment block, never genesis",
    );
  }
  return parsed;
}
