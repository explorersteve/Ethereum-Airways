const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;
const WEI_RE = /^\d+$/;

export function assertSessionId(sessionId: string): string {
  if (sessionId.length !== 36 || !UUID_RE.test(sessionId)) {
    throw new Error("Invalid session id");
  }
  return sessionId.toLowerCase();
}

export function assertAddress(value: string): string {
  if (!ADDRESS_RE.test(value)) {
    throw new Error("Invalid address");
  }
  return value.toLowerCase();
}

export function assertTxHash(value: string): string {
  if (!TX_HASH_RE.test(value)) {
    throw new Error("Invalid transaction hash");
  }
  return value.toLowerCase();
}

export function assertWeiString(value: string): string {
  if (!WEI_RE.test(value)) {
    throw new Error("Invalid wei amount");
  }
  return value;
}

export function assertBagCount(bagCount: number): number {
  if (!Number.isInteger(bagCount) || bagCount < 0 || bagCount > 65_535) {
    throw new Error("Invalid bag count");
  }
  return bagCount;
}
