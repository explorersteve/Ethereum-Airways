import { v } from "convex/values";

export const sessionStatus = v.union(
  v.literal("open"),
  v.literal("traveler"),
  v.literal("seated"),
  v.literal("complete"),
);

export const sessionDoc = v.object({
  sessionId: v.string(),
  walletAddress: v.optional(v.string()),
  status: sessionStatus,
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
});

export const draftDoc = v.object({
  sessionId: v.string(),
  fullName: v.string(),
  dateOfBirthISO: v.string(),
  twitterHandle: v.string(),
  updatedAt: v.number(),
});

export const sessionWithDraft = v.object({
  session: sessionDoc,
  draft: v.union(draftDoc, v.null()),
});

export const seatIndexListItem = v.object({
  seatId: v.number(),
  minted: v.boolean(),
  ownerAddress: v.optional(v.string()),
});

export const mintUi = v.object({
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
  vesselCraftId: v.optional(v.number()),
  vesselEntry: v.optional(v.number()),
});

export const mintListItem = v.object({
  chainId: v.number(),
  contractAddress: v.string(),
  tokenId: v.number(),
  txHash: v.string(),
  seatId: v.optional(v.number()),
  seatLabel: v.optional(v.string()),
  cabin: v.optional(v.string()),
  vesselCraftId: v.optional(v.number()),
  vesselEntry: v.optional(v.number()),
});
