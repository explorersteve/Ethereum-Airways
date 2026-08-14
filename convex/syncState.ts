import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { assertAddress } from "./lib/ids";

export const listCursors = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      chainId: v.number(),
      contractAddress: v.string(),
      lastProcessedBlock: v.number(),
      lastConfirmedBlock: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("syncState").take(32);
    return rows.map((row) => ({
      chainId: row.chainId,
      contractAddress: row.contractAddress,
      lastProcessedBlock: row.lastProcessedBlock,
      lastConfirmedBlock: row.lastConfirmedBlock,
    }));
  },
});

export const ensureCursor = internalMutation({
  args: {
    chainId: v.number(),
    contractAddress: v.string(),
    startBlock: v.number(),
  },
  returns: v.object({
    chainId: v.number(),
    contractAddress: v.string(),
    lastProcessedBlock: v.number(),
    lastConfirmedBlock: v.number(),
  }),
  handler: async (ctx, args) => {
    const contractAddress = assertAddress(args.contractAddress);
    const existing = await ctx.db
      .query("syncState")
      .withIndex("by_chain_contract", (q) =>
        q.eq("chainId", args.chainId).eq("contractAddress", contractAddress),
      )
      .unique();
    if (existing) {
      return {
        chainId: existing.chainId,
        contractAddress: existing.contractAddress,
        lastProcessedBlock: existing.lastProcessedBlock,
        lastConfirmedBlock: existing.lastConfirmedBlock,
      };
    }
    const lastProcessedBlock = Math.max(0, args.startBlock - 1);
    await ctx.db.insert("syncState", {
      chainId: args.chainId,
      contractAddress,
      lastProcessedBlock,
      lastConfirmedBlock: lastProcessedBlock,
      updatedAt: Date.now(),
    });
    return {
      chainId: args.chainId,
      contractAddress,
      lastProcessedBlock,
      lastConfirmedBlock: lastProcessedBlock,
    };
  },
});

export const advanceCursor = internalMutation({
  args: {
    chainId: v.number(),
    contractAddress: v.string(),
    lastProcessedBlock: v.number(),
    lastConfirmedBlock: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contractAddress = assertAddress(args.contractAddress);
    const existing = await ctx.db
      .query("syncState")
      .withIndex("by_chain_contract", (q) =>
        q.eq("chainId", args.chainId).eq("contractAddress", contractAddress),
      )
      .unique();
    if (!existing) {
      throw new Error("Sync cursor not found");
    }
    await ctx.db.patch("syncState", existing._id, {
      lastProcessedBlock: args.lastProcessedBlock,
      lastConfirmedBlock: args.lastConfirmedBlock,
      updatedAt: Date.now(),
    });
    return null;
  },
});
