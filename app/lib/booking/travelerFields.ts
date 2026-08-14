import { birthdayLabel, isValidIsoDate } from "./dob";
import { normalizeHandle } from "./handle";
import { NAME_MAX_BYTES, utf8ByteLength, validateName } from "./name";

export { NAME_MAX_BYTES };

export function nameByteCount(value: string): number {
  return utf8ByteLength(value.trim());
}

export function nameValidationMessage(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "Enter the name on your travel document.";
  }
  const result = validateName(value);
  if (result.ok) {
    return null;
  }
  if (utf8ByteLength(trimmed) > NAME_MAX_BYTES) {
    return "That name is a little long. Please shorten it to fit.";
  }
  return "Please use letters and punctuation only.";
}

export function dobValidationMessage(iso: string): string | null {
  if (iso.trim().length === 0) {
    return "Enter your date of birth.";
  }
  if (!isValidIsoDate(iso)) {
    return "Enter a real calendar date.";
  }
  return null;
}

export function derivedBirthday(iso: string): string | null {
  if (!isValidIsoDate(iso)) {
    return null;
  }
  return birthdayLabel(iso);
}

export function handleValidationMessage(value: string): string | null {
  const result = normalizeHandle(value);
  if (result.ok) {
    return null;
  }
  if (result.error.includes("spaces") || result.error.includes("control")) {
    return "Handles cannot include spaces.";
  }
  return "That handle is a little long. Please shorten it.";
}

export function canonicalHandle(value: string): string {
  const result = normalizeHandle(value);
  return result.ok ? result.value : value.trim().replace(/^@+/, "");
}

export type TravelerFieldErrors = {
  fullName: string | null;
  dateOfBirthISO: string | null;
  twitterHandle: string | null;
};

export function travelerFieldErrors(input: {
  fullName: string;
  dateOfBirthISO: string;
  twitterHandle: string;
}): TravelerFieldErrors {
  return {
    fullName: nameValidationMessage(input.fullName),
    dateOfBirthISO: dobValidationMessage(input.dateOfBirthISO),
    twitterHandle: handleValidationMessage(input.twitterHandle),
  };
}

export function travelerFieldsAreValid(errors: TravelerFieldErrors): boolean {
  return (
    errors.fullName === null &&
    errors.dateOfBirthISO === null &&
    errors.twitterHandle === null
  );
}
