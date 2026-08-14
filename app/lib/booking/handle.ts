const encoder = new TextEncoder();

export const HANDLE_MAX_BYTES = 32;

export type HandleResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

function utf8Bytes(value: string): number {
  return encoder.encode(value).length;
}

function hasForbiddenChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) {
      return true;
    }
  }
  return /\s/.test(value);
}

export function normalizeHandle(input: string): HandleResult {
  const stripped = input.trim().replace(/^@+/, "");
  if (stripped.length === 0) {
    return { ok: true, value: "" };
  }
  if (hasForbiddenChars(stripped)) {
    return {
      ok: false,
      error: "Handle cannot contain spaces or control characters",
    };
  }
  if (utf8Bytes(stripped) > HANDLE_MAX_BYTES) {
    return {
      ok: false,
      error: `Handle must be at most ${HANDLE_MAX_BYTES} UTF-8 bytes`,
    };
  }
  return { ok: true, value: stripped };
}
