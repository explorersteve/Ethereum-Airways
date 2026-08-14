import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex is not an ownership authority. Ethereum decides seats, fares,
 * payment, passenger records, and metadata. These tables are drafts,
 * caches, history, and a sync cursor. On conflict, Ethereum wins.
 */
export default defineSchema({
  bookingSessions: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_walletAddress", ["walletAddress"])
    .index("by_status", ["status"]),

  passengerDrafts: defineTable({
    sessionId: v.string(),
    fullName: v.string(),
    dateOfBirthISO: v.string(),
    twitterHandle: v.string(),
    updatedAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),

  seatIndex: defineTable({
    seatId: v.number(),
    seatLabel: v.string(),
    row: v.number(),
    column: v.string(),
    cabin: v.string(),
    seatPosition: v.string(),
    priceWei: v.string(),
    minted: v.boolean(),
    ownerAddress: v.optional(v.string()),
    tokenId: v.optional(v.number()),
    txHash: v.optional(v.string()),
    blockNumber: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_seatId", ["seatId"])
    .index("by_minted", ["minted"])
    .index("by_ownerAddress", ["ownerAddress"]),

  mints: defineTable({
    chainId: v.number(),
    contractAddress: v.string(),
    tokenId: v.number(),
    txHash: v.string(),
    status: v.union(v.literal("pending"), v.literal("verified")),
    seatId: v.optional(v.number()),
    seatLabel: v.optional(v.string()),
    cabin: v.optional(v.string()),
    seatPosition: v.optional(v.string()),
    travelerAddress: v.optional(v.string()),
    fullName: v.optional(v.string()),
    dateOfBirthISO: v.optional(v.string()),
    twitterHandle: v.optional(v.string()),
    bagCount: v.optional(v.number()),
    totalPaidWei: v.optional(v.string()),
    blockNumber: v.optional(v.number()),
    blockTimestamp: v.optional(v.number()),
    vesselCraftId: v.optional(v.number()),
    vesselEntry: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tokenId", ["tokenId"])
    .index("by_seatId", ["seatId"])
    .index("by_txHash", ["txHash"])
    .index("by_travelerAddress", ["travelerAddress"])
    .index("by_vessel_entry", ["vesselCraftId", "vesselEntry"])
    .index("by_chain_contract_token", ["chainId", "contractAddress", "tokenId"]),

  syncState: defineTable({
    chainId: v.number(),
    contractAddress: v.string(),
    lastProcessedBlock: v.number(),
    lastConfirmedBlock: v.number(),
    updatedAt: v.number(),
  }).index("by_chain_contract", ["chainId", "contractAddress"]),
});
