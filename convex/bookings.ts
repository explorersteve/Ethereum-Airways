import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { FLIGHT, seatExists } from "./lib/seats";
import {
  assertAddress,
  assertBagCount,
  assertSessionId,
  assertWeiString,
} from "./lib/ids";
import {
  isValidIsoDate,
  normalizeHandle,
  validateName,
} from "./lib/passenger";
import { sessionWithDraft } from "./lib/validators";

async function sessionBySessionId(ctx: MutationCtx, sessionId: string) {
  return await ctx.db
    .query("bookingSessions")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .unique();
}

export const upsertSession = mutation({
  args: {
    sessionId: v.string(),
    walletAddress: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("traveler"),
      v.literal("seated"),
      v.literal("complete"),
    ),
    flightNumber: v.literal("ETH001"),
    origin: v.literal("Current Location"),
    destination: v.literal("Ethereum"),
    tripType: v.literal("Round Trip"),
    departure: v.literal("Now"),
    baseFareWei: v.string(),
    selectedSeatId: v.optional(v.number()),
    selectedSeatLabel: v.optional(v.string()),
    selectedSeatPriceWei: v.optional(v.string()),
    bagCount: v.number(),
  },
  returns: v.id("bookingSessions"),
  handler: async (ctx, args) => {
    const sessionId = assertSessionId(args.sessionId);
    if (
      args.flightNumber !== FLIGHT.flightNumber ||
      args.origin !== FLIGHT.origin ||
      args.destination !== FLIGHT.destination ||
      args.tripType !== FLIGHT.tripType ||
      args.departure !== FLIGHT.departure ||
      assertWeiString(args.baseFareWei) !== FLIGHT.baseFareWei
    ) {
      throw new Error("Flight constants do not match ETH001");
    }
    const bagCount = assertBagCount(args.bagCount);
    if (args.selectedSeatId !== undefined && !seatExists(args.selectedSeatId)) {
      throw new Error(`Invalid seat: ${args.selectedSeatId}`);
    }
    const walletAddress =
      args.walletAddress !== undefined
        ? assertAddress(args.walletAddress)
        : undefined;
    const selectedSeatPriceWei =
      args.selectedSeatPriceWei !== undefined
        ? assertWeiString(args.selectedSeatPriceWei)
        : undefined;
    const now = Date.now();
    const existing = await sessionBySessionId(ctx, sessionId);
    const fields = {
      sessionId,
      walletAddress,
      status: args.status,
      flightNumber: args.flightNumber,
      origin: args.origin,
      destination: args.destination,
      tripType: args.tripType,
      departure: args.departure,
      baseFareWei: args.baseFareWei,
      selectedSeatId: args.selectedSeatId,
      selectedSeatLabel: args.selectedSeatLabel,
      selectedSeatPriceWei,
      bagCount,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch("bookingSessions", existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("bookingSessions", {
      ...fields,
      createdAt: now,
    });
  },
});

export const savePassengerDraft = mutation({
  args: {
    sessionId: v.string(),
    fullName: v.string(),
    dateOfBirthISO: v.string(),
    twitterHandle: v.string(),
  },
  returns: v.id("passengerDrafts"),
  handler: async (ctx, args) => {
    const sessionId = assertSessionId(args.sessionId);
    const fullName = validateName(args.fullName);
    const twitterHandle = normalizeHandle(args.twitterHandle);
    if (!isValidIsoDate(args.dateOfBirthISO)) {
      throw new Error("Invalid date of birth");
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("passengerDrafts")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();
    const fields = {
      sessionId,
      fullName,
      dateOfBirthISO: args.dateOfBirthISO,
      twitterHandle,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch("passengerDrafts", existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("passengerDrafts", fields);
  },
});

export const getSession = query({
  args: { sessionId: v.string() },
  returns: v.union(sessionWithDraft, v.null()),
  handler: async (ctx, args) => {
    const sessionId = assertSessionId(args.sessionId);
    const session = await ctx.db
      .query("bookingSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (!session) {
      return null;
    }
    const draft = await ctx.db
      .query("passengerDrafts")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();
    return {
      session: {
        sessionId: session.sessionId,
        walletAddress: session.walletAddress,
        status: session.status,
        flightNumber: session.flightNumber,
        origin: session.origin,
        destination: session.destination,
        tripType: session.tripType,
        departure: session.departure,
        baseFareWei: session.baseFareWei,
        selectedSeatId: session.selectedSeatId,
        selectedSeatLabel: session.selectedSeatLabel,
        selectedSeatPriceWei: session.selectedSeatPriceWei,
        bagCount: session.bagCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      draft: draft
        ? {
            sessionId: draft.sessionId,
            fullName: draft.fullName,
            dateOfBirthISO: draft.dateOfBirthISO,
            twitterHandle: draft.twitterHandle,
            updatedAt: draft.updatedAt,
          }
        : null,
    };
  },
});
