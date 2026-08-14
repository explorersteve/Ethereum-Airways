import { getAddress, isAddress } from "viem";

export function formatAddress(address: string): string {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  const checksummed = getAddress(address);
  return `${checksummed.slice(0, 6)}…${checksummed.slice(-4)}`;
}
