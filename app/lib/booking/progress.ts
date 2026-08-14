export const BOOKING_STEPS = [
  { id: "search", label: "Search" },
  { id: "flights", label: "Flights" },
  { id: "traveler", label: "Traveler" },
  { id: "seats", label: "Seats & Extras" },
  { id: "review", label: "Review" },
  { id: "boarding-pass", label: "Boarding Pass" },
] as const;

export type BookingStepId = (typeof BOOKING_STEPS)[number]["id"];

export type BookingStepState = "complete" | "current" | "upcoming";

export function bookingStepIndex(step: BookingStepId): number {
  return BOOKING_STEPS.findIndex((item) => item.id === step);
}

export function bookingStepState(
  step: BookingStepId,
  current: BookingStepId,
): BookingStepState {
  const stepIndex = bookingStepIndex(step);
  const currentIndex = bookingStepIndex(current);
  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}
