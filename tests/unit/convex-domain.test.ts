import { describe, expect, it } from "vitest";
import { SEATS as appSeats } from "../../app/lib/booking/seats";
import { seatPriceWei as appPrice } from "../../app/lib/booking/seatPricing";
import { SEATS as convexSeats, seatPriceWei as convexPrice } from "../../convex/lib/seats";
import {
  mintIdentityKey,
  nextBlockRange,
  upsertByMintIdentity,
} from "../../convex/lib/mints";

describe("convex seat geometry", () => {
  it("matches the app 184-seat map and prices", () => {
    expect(convexSeats).toHaveLength(184);
    expect(convexSeats.map((s) => s.seatId)).toEqual(appSeats.map((s) => s.seatId));
    for (const seat of appSeats) {
      expect(convexPrice(seat.seatId)).toBe(appPrice(seat.seatId));
    }
  });
});

describe("mint idempotency", () => {
  it("upserts on chainId + contract + tokenId so a second pass is a no-op for count", () => {
    const first = {
      chainId: 11155111,
      contractAddress: "0xabc0000000000000000000000000000000000001",
      tokenId: 121,
    };
    const again = {
      ...first,
      contractAddress: "0xABC0000000000000000000000000000000000001",
    };
    const once = upsertByMintIdentity([], first);
    const twice = upsertByMintIdentity(once, again);
    expect(once).toHaveLength(1);
    expect(twice).toHaveLength(1);
    expect(mintIdentityKey(first)).toBe(mintIdentityKey(again));
  });

  it("advances bounded log ranges without overlapping", () => {
    expect(nextBlockRange(100, 90)).toBeNull();
    expect(nextBlockRange(100, 2500)).toEqual({
      fromBlock: 101,
      toBlock: 2100,
    });
    const second = nextBlockRange(2100, 2500);
    expect(second).toEqual({ fromBlock: 2101, toBlock: 2500 });
  });
});
