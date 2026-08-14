import { describe, expect, it } from "vitest";
import { bookAndMintArgsFromState } from "../../app/lib/evm/bookingArgs";
import {
  applySelectSeat,
  applySetTraveler,
  createBookingState,
} from "../../app/lib/booking/state";

describe("bookAndMintArgsFromState", () => {
  it("builds contract args from a complete booking", () => {
    const state = createBookingState("s1");
    applySetTraveler(state, {
      fullName: "Ada Lovelace",
      dateOfBirthISO: "1998-05-12",
      twitterHandle: "ada",
    });
    applySelectSeat(state, 121);
    expect(bookAndMintArgsFromState(state)).toEqual({
      seatId: 121,
      fullName: "Ada Lovelace",
      dateOfBirth: 19980512,
      twitterHandle: "ada",
      bagCount: 0,
    });
  });
});
