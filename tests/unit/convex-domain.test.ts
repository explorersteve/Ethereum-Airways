import { describe, expect, it } from "vitest";
import { SEATS as appSeats } from "../../app/lib/booking/seats";
import { seatPriceWei as appPrice } from "../../app/lib/booking/seatPricing";
import { SEATS as convexSeats, seatPriceWei as convexPrice } from "../../convex/lib/seats";
import {
  mintIdentityKey,
  nextBlockRange,
  upsertByMintIdentity,
} from "../../convex/lib/mints";
import { parseDeploymentRecord } from "../../convex/lib/deployments";
import { syncStartBlock } from "../../convex/lib/rpc";
import { withRetry } from "../../convex/lib/retry";

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

  it("re-ingesting the same range keeps a single row per token", () => {
    const range = [
      {
        chainId: 11155111,
        contractAddress: "0xabc0000000000000000000000000000000000001",
        tokenId: 121,
      },
      {
        chainId: 11155111,
        contractAddress: "0xabc0000000000000000000000000000000000001",
        tokenId: 122,
      },
    ];
    let rows: typeof range = [];
    for (const event of range) {
      rows = upsertByMintIdentity(rows, event);
    }
    const afterFirst = rows.length;
    for (const event of range) {
      rows = upsertByMintIdentity(rows, event);
    }
    expect(afterFirst).toBe(2);
    expect(rows).toHaveLength(2);
  });
});

describe("sync start block and log retry", () => {
  it("requires a deployment block from deployments JSON, not genesis", () => {
    const record = parseDeploymentRecord({
      chainId: 31337,
      boardingPass: "0x00000000000000000000000000000000000000a1",
      deploymentBlock: 12,
    });
    expect(record.deploymentBlock).toBe(12);
    const previous = process.env.BOARDING_PASS_START_BLOCK;
    delete process.env.BOARDING_PASS_START_BLOCK;
    expect(() => syncStartBlock()).toThrow(/deployments/);
    process.env.BOARDING_PASS_START_BLOCK = "0";
    expect(() => syncStartBlock()).toThrow(/never genesis/);
    process.env.BOARDING_PASS_START_BLOCK = "12";
    expect(syncStartBlock()).toBe(12);
    if (previous === undefined) {
      delete process.env.BOARDING_PASS_START_BLOCK;
    } else {
      process.env.BOARDING_PASS_START_BLOCK = previous;
    }
  });

  it("retries a bounded log fetch and then succeeds", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      if (calls < 3) {
        throw new Error("rate limited");
      }
      return { fromBlock: 12, toBlock: 40, logs: 1 };
    }, 3, 1);
    expect(calls).toBe(3);
    expect(result.logs).toBe(1);
  });
});
