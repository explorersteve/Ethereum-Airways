import { describe, expect, it } from "vitest";
import { parseEther } from "viem";
import {
  deserializeBooking,
  loadBookingState,
  saveBookingState,
  serializeBooking,
} from "../../app/lib/booking/persist";
import {
  applySelectSeat,
  applySetBags,
  applySetQuote,
  applySetTraveler,
  createBookingState,
  derivedTotalWei,
} from "../../app/lib/booking/state";

describe("booking persistence", () => {
  it("round-trips bigints through a simulated reload", () => {
    const state = createBookingState("session-1");
    applySetTraveler(state, {
      fullName: "Ada Lovelace",
      dateOfBirthISO: "1998-05-12",
      twitterHandle: "@ada",
    });
    applySelectSeat(state, 121);
    applySetBags(state, 2);
    applySetQuote(state, parseEther("0.03"));

    const serialized = serializeBooking(state);
    const parsed: unknown = JSON.parse(serialized);
    expect(parsed).toMatchObject({
      baseFareWei: "1000000000000000",
      selectedSeatPriceWei: "9000000000000000",
      authoritativeQuoteWei: "30000000000000000",
    });
    expect(() => JSON.stringify(state)).toThrow(/bigint/i);

    const restored = deserializeBooking(serialized);
    expect(typeof restored.baseFareWei).toBe("bigint");
    expect(restored.baseFareWei).toBe(state.baseFareWei);
    expect(restored.selectedSeatPriceWei).toBe(state.selectedSeatPriceWei);
    expect(restored.authoritativeQuoteWei).toBe(30_000_000_000_000_000n);
    expect(restored.twitterHandle).toBe("ada");
    expect(restored.dateOfBirthUint32).toBe(19980512);
    expect(derivedTotalWei(restored)).toBe(30_000_000_000_000_000n);

    const storage = new Map<string, string>();
    const memory: Storage = {
      get length() {
        return storage.size;
      },
      clear() {
        storage.clear();
      },
      getItem(key) {
        return storage.get(key) ?? null;
      },
      key(index) {
        return [...storage.keys()][index] ?? null;
      },
      removeItem(key) {
        storage.delete(key);
      },
      setItem(key, value) {
        storage.set(key, value);
      },
    };
    saveBookingState(memory, state);
    const reloaded = loadBookingState(memory);
    expect(reloaded?.selectedSeatPriceWei).toBe(state.selectedSeatPriceWei);
    expect(reloaded?.sessionId).toBe("session-1");
  });
});
