const encoder = new TextEncoder();

export const NAME_MIN_BYTES = 1;
export const NAME_MAX_BYTES = 48;

export type NameResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function utf8ByteLength(value: string): number {
  return encoder.encode(value).length;
}

export function validateName(input: string): NameResult {
  const value = input.trim();
  const bytes = utf8ByteLength(value);
  if (bytes < NAME_MIN_BYTES || bytes > NAME_MAX_BYTES) {
    return {
      ok: false,
      error: `Name must be ${NAME_MIN_BYTES}–${NAME_MAX_BYTES} UTF-8 bytes`,
    };
  }
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return {
        ok: false,
        error: "Name cannot contain control characters",
      };
    }
  }
  return { ok: true, value };
}
