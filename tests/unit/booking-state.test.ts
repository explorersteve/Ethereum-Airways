import { describe, expect, it } from "vitest";
import { BAG_PRICE_WEI, FLIGHT } from "../../app/lib/booking/flight";
import { seatPriceWei } from "../../app/lib/booking/seatPricing";
import {
  applyClearSeat,
  applyReset,
  applySelectFlight,
  applySelectSeat,
  applySetBags,
  applySetTraveler,
  createBookingState,
  derivedBagsTotalWei,
  derivedTotalWei,
  reviewIsReady,
  travelerIsComplete,
} from "../../app/lib/booking/state";

describe("booking state", () => {
  it("selects the fixed flight and computes totals without floats", () => {
    const state = createBookingState("abc");
    applySelectFlight(state);
    expect(state.flightNumber).toBe("ETH001");
    applySelectSeat(state, 121);
    applySetBags(state, 3);
    expect(derivedBagsTotalWei(state)).toBe(BAG_PRICE_WEI * 3n);
    expect(derivedTotalWei(state)).toBe(
      FLIGHT.baseFareWei + seatPriceWei(121) + BAG_PRICE_WEI * 3n,
    );
  });

  it("requires a complete traveler and seat before review", () => {
    const state = createBookingState("abc");
    expect(travelerIsComplete(state)).toBe(false);
    applySetTraveler(state, {
      fullName: "Ada Lovelace",
      dateOfBirthISO: "1998-05-12",
      twitterHandle: "ada",
    });
    expect(travelerIsComplete(state)).toBe(true);
    expect(reviewIsReady(state)).toBe(false);
    applySelectSeat(state, 46);
    expect(reviewIsReady(state)).toBe(true);
    applyClearSeat(state);
    expect(reviewIsReady(state)).toBe(false);
  });

  it("reset keeps the session id", () => {
    const state = createBookingState("keep-me");
    applySetTraveler(state, {
      fullName: "Ada Lovelace",
      dateOfBirthISO: "1998-05-12",
      twitterHandle: "ada",
    });
    applyReset(state);
    expect(state.sessionId).toBe("keep-me");
    expect(state.fullName).toBe("");
    expect(state.selectedSeatId).toBeUndefined();
  });
});
