const encoder = new TextEncoder();

export const NAME_MAX_BYTES = 48;
export const HANDLE_MAX_BYTES = 32;

export function utf8ByteLength(value: string): number {
  return encoder.encode(value).length;
}

function hasControlChars(value: string, includeSpace: boolean): boolean {
  const max = includeSpace ? 0x20 : 0x1f;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= max || code === 0x7f) {
      return true;
    }
  }
  return includeSpace ? /\s/.test(value) : false;
}

export function validateName(input: string): string {
  if (utf8ByteLength(input) > NAME_MAX_BYTES) {
    throw new Error("Name exceeds 48 UTF-8 bytes");
  }
  const value = input.trim();
  const bytes = utf8ByteLength(value);
  if (bytes < 1 || bytes > NAME_MAX_BYTES) {
    throw new Error("Name must be 1–48 UTF-8 bytes");
  }
  if (hasControlChars(value, false)) {
    throw new Error("Name cannot contain control characters");
  }
  return value;
}

export function normalizeHandle(input: string): string {
  if (utf8ByteLength(input) > HANDLE_MAX_BYTES + 8) {
    throw new Error("Handle exceeds 32 UTF-8 bytes");
  }
  const stripped = input.trim().replace(/^@+/, "");
  if (stripped.length === 0) {
    return "";
  }
  if (hasControlChars(stripped, true)) {
    throw new Error("Handle cannot contain spaces or control characters");
  }
  if (utf8ByteLength(stripped) > HANDLE_MAX_BYTES) {
    throw new Error("Handle exceeds 32 UTF-8 bytes");
  }
  return stripped;
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

export function isValidIsoDate(iso: string): boolean {
  const match = ISO_RE.exec(iso);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  return day <= daysInMonth(year, month);
}

export function uint32ToIso(value: number): string {
  const year = Math.floor(value / 10000);
  const month = Math.floor((value % 10000) / 100);
  const day = value % 100;
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (!isValidIsoDate(iso)) {
    throw new Error(`Invalid date of birth: ${value}`);
  }
  return iso;
}
