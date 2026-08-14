import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { SEATS, seatPriceWei } from "./lib/seats";
import { writeSeatMinted } from "./lib/seatIndexWrite";
import { seatIndexListItem } from "./lib/validators";

export const seedSeatIndex = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    let inserted = 0;
    for (const seat of SEATS) {
      const existing = await ctx.db
        .query("seatIndex")
        .withIndex("by_seatId", (q) => q.eq("seatId", seat.seatId))
        .unique();
      if (existing) {
        continue;
      }
      await ctx.db.insert("seatIndex", {
        seatId: seat.seatId,
        seatLabel: seat.label,
        row: seat.row,
        column: seat.column,
        cabin: seat.cabin,
        seatPosition: seat.position,
        priceWei: seatPriceWei(seat.seatId).toString(10),
        minted: false,
        updatedAt: now,
      });
      inserted += 1;
    }
    return inserted;
  },
});

export const listSeatIndex = query({
  args: {},
  returns: v.array(seatIndexListItem),
  handler: async (ctx) => {
    const rows = await ctx.db.query("seatIndex").take(184);
    return rows.map((row) => ({
      seatId: row.seatId,
      minted: row.minted,
      ownerAddress: row.ownerAddress,
    }));
  },
});

export const markSeatMinted = internalMutation({
  args: {
    seatId: v.number(),
    ownerAddress: v.string(),
    tokenId: v.number(),
    txHash: v.string(),
    blockNumber: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await writeSeatMinted(ctx, args);
    return null;
  },
});
