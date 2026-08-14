import { getAddress, isAddress } from "viem";

export function formatAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  const checksummed = getAddress(address);
  return `${checksummed.slice(0, 6)}…${checksummed.slice(-4)}`;
}

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

export function formatTxHash(hash: string): string {
  if (!TX_HASH_RE.test(hash)) {
    throw new Error(`Invalid transaction hash: ${hash}`);
  }
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}
