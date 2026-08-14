import { formatEther, parseEther } from "viem";

const WEI_PER_ETH = 1_000_000_000_000_000_000n;

export function formatEth(wei: bigint): string {
  return formatEther(wei);
}

/** Fixed-decimal ETH string from wei. No floating-point arithmetic. */
export function formatEthFixed(wei: bigint, fractionDigits: number): string {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 18) {
    throw new Error(`Invalid fraction digits: ${fractionDigits}`);
  }
  const negative = wei < 0n;
  const abs = negative ? -wei : wei;
  const whole = abs / WEI_PER_ETH;
  const frac = abs % WEI_PER_ETH;
  const fracPadded = frac.toString().padStart(18, "0");
  const sign = negative ? "-" : "";
  if (fractionDigits === 0) {
    return `${sign}${whole.toString()}`;
  }
  const digits = fracPadded.slice(0, fractionDigits).padEnd(fractionDigits, "0");
  return `${sign}${whole.toString()}.${digits}`;
}

export function parseEthToWei(value: string): bigint {
  return parseEther(value);
}
