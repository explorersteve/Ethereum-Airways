const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

export function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return false;
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }
  if (!Number.isInteger(day) || day < 1) {
    return false;
  }
  return day <= daysInMonth(year, month);
}

export function parseIsoDate(
  iso: string,
): { year: number; month: number; day: number } | null {
  const match = ISO_RE.exec(iso);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) {
    return null;
  }
  return { year, month, day };
}

export function isValidIsoDate(iso: string): boolean {
  return parseIsoDate(iso) !== null;
}

export function isoToUint32(iso: string): number {
  const parsed = parseIsoDate(iso);
  if (!parsed) {
    throw new Error(`Invalid date of birth: ${iso}`);
  }
  return parsed.year * 10000 + parsed.month * 100 + parsed.day;
}

export function tryIsoToUint32(iso: string): number | null {
  try {
    return isoToUint32(iso);
  } catch {
    return null;
  }
}

export function uint32ToIso(value: number): string {
  if (!Number.isInteger(value) || value < 10101 || value > 99991231) {
    throw new Error(`Invalid date of birth: ${value}`);
  }
  const year = Math.floor(value / 10000);
  const month = Math.floor((value % 10000) / 100);
  const day = value % 100;
  if (!isValidCalendarDate(year, month, day)) {
    throw new Error(`Invalid date of birth: ${value}`);
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function birthdayLabel(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) {
    throw new Error(`Invalid date of birth: ${iso}`);
  }
  const monthName = MONTH_NAMES[parsed.month - 1];
  if (!monthName) {
    throw new Error(`Invalid date of birth: ${iso}`);
  }
  return `${monthName} ${parsed.day}`;
}
