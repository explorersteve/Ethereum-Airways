import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.ts");

const verifiedArgs = {
  chainId: 11155111,
  contractAddress: "0x00000000000000000000000000000000000000a1",
  tokenId: 121,
  txHash:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  seatId: 121,
  travelerAddress: "0x00000000000000000000000000000000000000b1",
  fullName: "Ada Lovelace",
  dateOfBirthUint32: 19980512,
  twitterHandle: "ada",
  bagCount: 1,
  totalPaidWei: "20000000000000000",
  blockNumber: 10,
  blockTimestamp: 1_700_000_000,
  vesselCraftId: 6675,
  vesselEntry: 1,
};

describe("convex mint index", () => {
  it("upserts the same chain+contract+token only once", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.seats.seedSeatIndex, {});
    const first = await t.mutation(
      internal.mints.applyVerifiedMint,
      verifiedArgs,
    );
    const second = await t.mutation(
      internal.mints.applyVerifiedMint,
      verifiedArgs,
    );
    expect(second).toBe(first);
    const rows = await t.run(async (ctx) => {
      return await ctx.db.query("mints").take(10);
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("verified");
  });
});
