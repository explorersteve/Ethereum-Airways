import { describe, expect, it } from "vitest";
import {
  BOOKING_STEPS,
  bookingStepIndex,
  bookingStepState,
} from "../app/lib/booking/progress";

describe("booking progress", () => {
  it("has six named steps", () => {
    expect(BOOKING_STEPS.map((step) => step.label)).toEqual([
      "Search",
      "Flights",
      "Traveler",
      "Seats & Extras",
      "Review",
      "Boarding Pass",
    ]);
  });

  it("marks complete, current, and upcoming from a single step id", () => {
    expect(bookingStepIndex("traveler")).toBe(2);
    expect(bookingStepState("search", "traveler")).toBe("complete");
    expect(bookingStepState("traveler", "traveler")).toBe("current");
    expect(bookingStepState("review", "traveler")).toBe("upcoming");
  });
});
