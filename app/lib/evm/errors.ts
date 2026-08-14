import { UserRejectedRequestError } from "viem";

export type DecodedBookingError = {
  name: string;
  message: string;
  details: string;
};

const USER_REJECTED_MESSAGE = "Booking canceled. No charge was made.";
const GENERIC_MESSAGE =
  "We couldn't complete your booking. Please try again.";

const SELECTOR_RE = /0x[a-fA-F0-9]{8}\b/;

const AIRLINE_COPY: Record<string, string> = {
  SeatAlreadyClaimed:
    "This seat was just claimed. Please choose another seat.",
  IncorrectPayment: "The fare changed. We've refreshed your total.",
  VesselCraftLocked: "Booking is temporarily unavailable.",
  VesselDelegateMismatch: "Booking is temporarily unavailable.",
  VesselCraftNotVault: "Booking is temporarily unavailable.",
  VesselEntryMismatch: "Booking is temporarily unavailable.",
  VesselPayloadTooLarge: "Booking is temporarily unavailable.",
  InvalidDateOfBirth: "Please check your date of birth.",
  InvalidName: "Please check your traveler name.",
  InvalidTwitterHandle: "Please check your X handle.",
  InvalidSeat: "This seat was just claimed. Please choose another seat.",
  EnforcedPause: "Booking is temporarily unavailable.",
  UserRejectedRequestError: USER_REJECTED_MESSAGE,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function walk(value: unknown, visit: (node: Record<string, unknown>) => void) {
  const seen = new Set<unknown>();
  let current: unknown = value;
  while (isRecord(current) && !seen.has(current)) {
    seen.add(current);
    visit(current);
    current = current.cause;
  }
}

function collectErrorName(error: unknown): string | undefined {
  let found: string | undefined;
  walk(error, (node) => {
    if (found) {
      return;
    }
    if (typeof node.name === "string" && node.name === "UserRejectedRequestError") {
      found = "UserRejectedRequestError";
      return;
    }
    const data = node.data;
    if (isRecord(data) && typeof data.errorName === "string") {
      found = data.errorName;
      return;
    }
    if (typeof node.errorName === "string") {
      found = node.errorName;
    }
  });
  return found;
}

function isUserRejection(error: unknown): boolean {
  if (error instanceof UserRejectedRequestError) {
    return true;
  }
  let rejected = false;
  walk(error, (node) => {
    if (node.name === "UserRejectedRequestError" || node.code === 4001) {
      rejected = true;
    }
  });
  return rejected;
}

function technicalDetail(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function stripSelector(message: string): string {
  if (SELECTOR_RE.test(message) && message.trim().startsWith("0x")) {
    return GENERIC_MESSAGE;
  }
  return message.replace(SELECTOR_RE, "").trim() || GENERIC_MESSAGE;
}

export function decodeBookingError(error: unknown): DecodedBookingError {
  if (process.env.NODE_ENV !== "production") {
    console.error("[booking]", error);
  }

  if (isUserRejection(error)) {
    return {
      name: "UserRejectedRequestError",
      message: USER_REJECTED_MESSAGE,
      details: technicalDetail(error),
    };
  }

  const name = collectErrorName(error);
  const mapped = name ? AIRLINE_COPY[name] : undefined;
  if (name && mapped) {
    return {
      name,
      message: mapped,
      details: technicalDetail(error),
    };
  }

  return {
    name: name ?? "Unknown",
    message: GENERIC_MESSAGE,
    details: stripSelector(technicalDetail(error)),
  };
}
