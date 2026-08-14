import type { BookingState } from "./state";

export type SessionStatus = "open" | "traveler" | "seated" | "complete";

export function sessionMutationArgs(
  state: BookingState,
  status: SessionStatus,
) {
  return {
    sessionId: state.sessionId,
    walletAddress: state.walletAddress,
    status,
    flightNumber: state.flightNumber,
    origin: state.origin,
    destination: state.destination,
    tripType: state.tripType,
    departure: state.departure,
    baseFareWei: state.baseFareWei.toString(10),
    selectedSeatId: state.selectedSeatId,
    selectedSeatLabel: state.selectedSeatLabel,
    selectedSeatPriceWei: state.selectedSeatPriceWei?.toString(10),
    bagCount: state.bagCount,
  };
}

export function passengerDraftArgs(state: BookingState) {
  return {
    sessionId: state.sessionId,
    fullName: state.fullName,
    dateOfBirthISO: state.dateOfBirthISO,
    twitterHandle: state.twitterHandle,
  };
}
