export const BOOKING_TX_COPY = {
  confirmWallet: "Confirm your booking in your wallet",
  inFlight: "Booking your flight…",
  cleared: "You're cleared for Ethereum.",
} as const;

export function bookingLiveMessage(step: string): string {
  if (step === "confirm" || step === "requesting" || step === "chain") {
    return BOOKING_TX_COPY.confirmWallet;
  }
  if (step === "waiting") {
    return BOOKING_TX_COPY.inFlight;
  }
  if (step === "complete") {
    return BOOKING_TX_COPY.cleared;
  }
  return "";
}
