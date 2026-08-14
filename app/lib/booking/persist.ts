import type { BookingState } from "./state";
import { createBookingState } from "./state";
import { FLIGHT } from "./flight";

export const BOOKING_STORAGE_KEY = "ethair.booking";
export const SESSION_STORAGE_KEY = "ethair.sessionId";

type BigintField =
  | "baseFareWei"
  | "selectedSeatPriceWei"
  | "authoritativeQuoteWei";

type BookingSnapshot = Omit<
  BookingState,
  "baseFareWei" | "selectedSeatPriceWei" | "authoritativeQuoteWei"
> & {
  baseFareWei: string;
  selectedSeatPriceWei?: string;
  authoritativeQuoteWei?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptionalString(
  value: unknown,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readHexAddress(value: unknown): `0x${string}` | undefined {
  return typeof value === "string" && value.startsWith("0x")
    ? (value as `0x${string}`)
    : undefined;
}

function readBigintField(
  snapshot: Record<string, unknown>,
  field: BigintField,
): bigint | undefined {
  const raw = snapshot[field];
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== "string" || !/^-?\d+$/.test(raw)) {
    throw new Error(`Invalid persisted bigint for ${field}`);
  }
  return BigInt(raw);
}

export function serializeBooking(state: BookingState): string {
  const snapshot: BookingSnapshot = {
    ...state,
    baseFareWei: state.baseFareWei.toString(10),
    selectedSeatPriceWei: state.selectedSeatPriceWei?.toString(10),
    authoritativeQuoteWei: state.authoritativeQuoteWei?.toString(10),
  };
  return JSON.stringify(snapshot);
}

export function deserializeBooking(serialized: string): BookingState {
  const parsed: unknown = JSON.parse(serialized);
  if (!isRecord(parsed) || typeof parsed.sessionId !== "string") {
    throw new Error("Invalid persisted booking state");
  }

  const state = createBookingState(parsed.sessionId);
  state.flightNumber = FLIGHT.flightNumber;
  state.origin = FLIGHT.origin;
  state.destination = FLIGHT.destination;
  state.tripType = FLIGHT.tripType;
  state.departure = FLIGHT.departure;
  state.fullName =
    typeof parsed.fullName === "string" ? parsed.fullName : "";
  state.dateOfBirthISO =
    typeof parsed.dateOfBirthISO === "string" ? parsed.dateOfBirthISO : "";
  state.twitterHandle =
    typeof parsed.twitterHandle === "string" ? parsed.twitterHandle : "";
  state.bagCount =
    typeof parsed.bagCount === "number" && Number.isInteger(parsed.bagCount)
      ? parsed.bagCount
      : 0;

  const baseFareWei = readBigintField(parsed, "baseFareWei");
  if (baseFareWei !== undefined) {
    state.baseFareWei = baseFareWei;
  }

  const dateOfBirthUint32 = readOptionalNumber(parsed.dateOfBirthUint32);
  if (dateOfBirthUint32 !== undefined) {
    state.dateOfBirthUint32 = dateOfBirthUint32;
  }

  const selectedSeatId = readOptionalNumber(parsed.selectedSeatId);
  if (selectedSeatId !== undefined) {
    state.selectedSeatId = selectedSeatId;
  }
  const selectedSeatLabel = readOptionalString(parsed.selectedSeatLabel);
  if (selectedSeatLabel !== undefined) {
    state.selectedSeatLabel = selectedSeatLabel;
  }
  const selectedSeatPriceWei = readBigintField(parsed, "selectedSeatPriceWei");
  if (selectedSeatPriceWei !== undefined) {
    state.selectedSeatPriceWei = selectedSeatPriceWei;
  }
  const authoritativeQuoteWei = readBigintField(
    parsed,
    "authoritativeQuoteWei",
  );
  if (authoritativeQuoteWei !== undefined) {
    state.authoritativeQuoteWei = authoritativeQuoteWei;
  }

  const walletAddress = readHexAddress(parsed.walletAddress);
  if (walletAddress !== undefined) {
    state.walletAddress = walletAddress;
  }
  const txHash = readHexAddress(parsed.txHash);
  if (txHash !== undefined) {
    state.txHash = txHash;
  }
  const tokenId = readOptionalNumber(parsed.tokenId);
  if (tokenId !== undefined) {
    state.tokenId = tokenId;
  }
  const vesselCraftId = readOptionalNumber(parsed.vesselCraftId);
  if (vesselCraftId !== undefined) {
    state.vesselCraftId = vesselCraftId;
  }
  const vesselEntry = readOptionalNumber(parsed.vesselEntry);
  if (vesselEntry !== undefined) {
    state.vesselEntry = vesselEntry;
  }

  return state;
}

export function createSessionId(): string {
  return crypto.randomUUID();
}

export function readStoredSessionId(storage: Storage): string | null {
  return storage.getItem(SESSION_STORAGE_KEY);
}

export function writeStoredSessionId(storage: Storage, sessionId: string): void {
  storage.setItem(SESSION_STORAGE_KEY, sessionId);
}

export function loadBookingState(storage: Storage): BookingState | null {
  const raw = storage.getItem(BOOKING_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const state = deserializeBooking(raw);
    const storedSession = readStoredSessionId(storage);
    if (storedSession) {
      state.sessionId = storedSession;
    }
    return state;
  } catch {
    return null;
  }
}

export function saveBookingState(storage: Storage, state: BookingState): void {
  writeStoredSessionId(storage, state.sessionId);
  storage.setItem(BOOKING_STORAGE_KEY, serializeBooking(state));
}
