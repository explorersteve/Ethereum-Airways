function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectErrorName(error: unknown): string | undefined {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (isRecord(current) && !seen.has(current)) {
    seen.add(current);
    const data = current.data;
    if (isRecord(data) && typeof data.errorName === "string") {
      return data.errorName;
    }
    if (typeof current.errorName === "string") {
      return current.errorName;
    }
    if (
      typeof current.name === "string" &&
      current.name === "ERC721NonexistentToken"
    ) {
      return current.name;
    }
    current = current.cause;
  }
  return undefined;
}

export type PassReadFailure = "missing" | "rpc";

export function classifyPassReadError(error: unknown): PassReadFailure {
  if (collectErrorName(error) === "ERC721NonexistentToken") {
    return "missing";
  }
  return "rpc";
}

export function parseTokenIdParam(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
