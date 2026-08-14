import { isValidIsoDate, tryIsoToUint32 } from "./dob";
import { BAG_PRICE_WEI, FLIGHT, MAX_BAGS } from "./flight";
import { normalizeHandle } from "./handle";
import { validateName } from "./name";
import { seatById } from "./seats";
import { quoteWei, seatPriceWei } from "./seatPricing";

export type BookingState = {
  sessionId: string;

  flightNumber: "ETH001";
  origin: "Current Location";
  destination: "Ethereum";
  tripType: "Round Trip";
  departure: "Now";

  baseFareWei: bigint;

  fullName: string;
  dateOfBirthISO: string;
  dateOfBirthUint32?: number;
  twitterHandle: string;

  selectedSeatId?: number;
  selectedSeatLabel?: string;
  selectedSeatPriceWei?: bigint;

  bagCount: number;

  authoritativeQuoteWei?: bigint;

  walletAddress?: `0x${string}`;

  txHash?: `0x${string}`;
  tokenId?: number;
  vesselCraftId?: number;
  vesselEntry?: number;
};

export type TravelerInput = {
  fullName: string;
  dateOfBirthISO: string;
  twitterHandle: string;
};

export type BookingResult = {
  walletAddress?: `0x${string}`;
  txHash?: `0x${string}`;
  tokenId?: number;
  vesselCraftId?: number;
  vesselEntry?: number;
};

export type RemoteBookingDraft = {
  fullName: string;
  dateOfBirthISO: string;
  twitterHandle: string;
};

export type RemoteBookingSession = {
  selectedSeatId?: number;
  bagCount: number;
};

export function createBookingState(sessionId: string): BookingState {
  return {
    sessionId,
    flightNumber: FLIGHT.flightNumber,
    origin: FLIGHT.origin,
    destination: FLIGHT.destination,
    tripType: FLIGHT.tripType,
    departure: FLIGHT.departure,
    baseFareWei: FLIGHT.baseFareWei,
    fullName: "",
    dateOfBirthISO: "",
    twitterHandle: "",
    bagCount: 0,
  };
}

export function applySelectFlight(state: BookingState): void {
  state.flightNumber = FLIGHT.flightNumber;
  state.origin = FLIGHT.origin;
  state.destination = FLIGHT.destination;
  state.tripType = FLIGHT.tripType;
  state.departure = FLIGHT.departure;
  state.baseFareWei = FLIGHT.baseFareWei;
}

export function applySetTraveler(
  state: BookingState,
  input: TravelerInput,
): void {
  const name = validateName(input.fullName);
  state.fullName = name.ok ? name.value : input.fullName.trim();
  state.dateOfBirthISO = input.dateOfBirthISO;
  const dob = tryIsoToUint32(input.dateOfBirthISO);
  if (dob !== null) {
    state.dateOfBirthUint32 = dob;
  } else {
    delete state.dateOfBirthUint32;
  }
  const handle = normalizeHandle(input.twitterHandle);
  state.twitterHandle = handle.ok
    ? handle.value
    : input.twitterHandle.trim().replace(/^@+/, "");
}

export function applySelectSeat(state: BookingState, seatId: number): void {
  const seat = seatById(seatId);
  if (!seat) {
    throw new Error(`Invalid seat: ${seatId}`);
  }
  state.selectedSeatId = seat.seatId;
  state.selectedSeatLabel = seat.label;
  state.selectedSeatPriceWei = seatPriceWei(seat.seatId);
  delete state.authoritativeQuoteWei;
}

export function applyClearSeat(state: BookingState): void {
  delete state.selectedSeatId;
  delete state.selectedSeatLabel;
  delete state.selectedSeatPriceWei;
  delete state.authoritativeQuoteWei;
}

export function applySetBags(state: BookingState, bagCount: number): void {
  if (!Number.isInteger(bagCount) || bagCount < 0) {
    throw new Error(`Invalid bag count: ${bagCount}`);
  }
  state.bagCount = Math.min(bagCount, MAX_BAGS);
  delete state.authoritativeQuoteWei;
}

export function applySetQuote(state: BookingState, quote: bigint): void {
  if (quote < 0n) {
    throw new Error("Quote cannot be negative");
  }
  state.authoritativeQuoteWei = quote;
}

export function applySetResult(
  state: BookingState,
  result: BookingResult,
): void {
  if (result.walletAddress !== undefined) {
    state.walletAddress = result.walletAddress;
  }
  if (result.txHash !== undefined) {
    state.txHash = result.txHash;
  }
  if (result.tokenId !== undefined) {
    state.tokenId = result.tokenId;
  }
  if (result.vesselCraftId !== undefined) {
    state.vesselCraftId = result.vesselCraftId;
  }
  if (result.vesselEntry !== undefined) {
    state.vesselEntry = result.vesselEntry;
  }
}

export function applyReset(state: BookingState): void {
  const next = createBookingState(state.sessionId);
  state.flightNumber = next.flightNumber;
  state.origin = next.origin;
  state.destination = next.destination;
  state.tripType = next.tripType;
  state.departure = next.departure;
  state.baseFareWei = next.baseFareWei;
  state.fullName = next.fullName;
  state.dateOfBirthISO = next.dateOfBirthISO;
  state.twitterHandle = next.twitterHandle;
  state.bagCount = next.bagCount;
  delete state.dateOfBirthUint32;
  delete state.selectedSeatId;
  delete state.selectedSeatLabel;
  delete state.selectedSeatPriceWei;
  delete state.authoritativeQuoteWei;
  delete state.walletAddress;
  delete state.txHash;
  delete state.tokenId;
  delete state.vesselCraftId;
  delete state.vesselEntry;
}

export function travelerIsComplete(state: BookingState): boolean {
  return (
    validateName(state.fullName).ok &&
    isValidIsoDate(state.dateOfBirthISO) &&
    normalizeHandle(state.twitterHandle).ok
  );
}

export function reviewIsReady(state: BookingState): boolean {
  return travelerIsComplete(state) && state.selectedSeatId !== undefined;
}

export function derivedSeatPriceWei(state: BookingState): bigint {
  return state.selectedSeatPriceWei ?? 0n;
}

export function derivedBagsTotalWei(state: BookingState): bigint {
  return BAG_PRICE_WEI * BigInt(state.bagCount);
}

export function derivedTotalWei(state: BookingState): bigint {
  if (state.authoritativeQuoteWei !== undefined) {
    return state.authoritativeQuoteWei;
  }
  if (state.selectedSeatId !== undefined) {
    return quoteWei(state.selectedSeatId, state.bagCount);
  }
  return FLIGHT.baseFareWei + derivedBagsTotalWei(state);
}

/** Fill empty local fields from Convex. Local entered values always win. */
export function mergeRemoteDraft(
  state: BookingState,
  remote: { session: RemoteBookingSession; draft: RemoteBookingDraft | null },
): void {
  if (remote.draft && state.fullName.trim().length === 0) {
    applySetTraveler(state, remote.draft);
  }
  if (
    state.selectedSeatId === undefined &&
    remote.session.selectedSeatId !== undefined
  ) {
    applySelectSeat(state, remote.session.selectedSeatId);
  }
  if (state.bagCount === 0 && remote.session.bagCount > 0) {
    applySetBags(state, remote.session.bagCount);
  }
}
