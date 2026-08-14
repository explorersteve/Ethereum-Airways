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
  mergeRemoteDraft,
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

  it("computes totals across seat and bag combinations in wei only", () => {
    const state = createBookingState("abc");
    applySelectFlight(state);
    expect(derivedTotalWei(state)).toBe(FLIGHT.baseFareWei);

    applySetBags(state, 2);
    expect(derivedBagsTotalWei(state)).toBe(BAG_PRICE_WEI * 2n);
    expect(derivedTotalWei(state)).toBe(FLIGHT.baseFareWei + BAG_PRICE_WEI * 2n);

    applySelectSeat(state, 11);
    expect(derivedTotalWei(state)).toBe(
      FLIGHT.baseFareWei + seatPriceWei(11) + BAG_PRICE_WEI * 2n,
    );

    applySelectSeat(state, 122);
    applySetBags(state, 0);
    expect(derivedTotalWei(state)).toBe(FLIGHT.baseFareWei + seatPriceWei(122));

    applyClearSeat(state);
    applySetBags(state, 1);
    expect(derivedTotalWei(state)).toBe(FLIGHT.baseFareWei + BAG_PRICE_WEI);
  });

  it("fills empty local fields from a Convex draft without overwriting", () => {
    const empty = createBookingState("abc");
    mergeRemoteDraft(empty, {
      session: { selectedSeatId: 121, bagCount: 4 },
      draft: {
        fullName: "Ada Lovelace",
        dateOfBirthISO: "1998-05-12",
        twitterHandle: "ada",
      },
    });
    expect(empty.fullName).toBe("Ada Lovelace");
    expect(empty.selectedSeatId).toBe(121);
    expect(empty.bagCount).toBe(4);

    const local = createBookingState("abc");
    applySetTraveler(local, {
      fullName: "Local Name",
      dateOfBirthISO: "2000-01-01",
      twitterHandle: "local",
    });
    applySetBags(local, 0);
    mergeRemoteDraft(local, {
      session: { selectedSeatId: 46, bagCount: 9 },
      draft: {
        fullName: "Remote Name",
        dateOfBirthISO: "1998-05-12",
        twitterHandle: "remote",
      },
    });
    expect(local.fullName).toBe("Local Name");
    expect(local.selectedSeatId).toBe(46);
    expect(local.bagCount).toBe(9);
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
