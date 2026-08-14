import type { MutationCtx } from "../_generated/server";
import { assertAddress, assertTxHash } from "./ids";
import { seatById, seatExists, seatPriceWei } from "./seats";

export async function writeSeatMinted(
  ctx: MutationCtx,
  args: {
    seatId: number;
    ownerAddress: string;
    tokenId: number;
    txHash: string;
    blockNumber: number;
  },
): Promise<void> {
  if (!seatExists(args.seatId)) {
    throw new Error(`Invalid seat: ${args.seatId}`);
  }
  const seat = seatById(args.seatId);
  if (!seat) {
    throw new Error(`Invalid seat: ${args.seatId}`);
  }
  const existing = await ctx.db
    .query("seatIndex")
    .withIndex("by_seatId", (q) => q.eq("seatId", args.seatId))
    .unique();
  const ownerAddress = assertAddress(args.ownerAddress);
  const txHash = assertTxHash(args.txHash);
  const now = Date.now();
  if (!existing) {
    await ctx.db.insert("seatIndex", {
      seatId: seat.seatId,
      seatLabel: seat.label,
      row: seat.row,
      column: seat.column,
      cabin: seat.cabin,
      seatPosition: seat.position,
      priceWei: seatPriceWei(seat.seatId).toString(10),
      minted: true,
      ownerAddress,
      tokenId: args.tokenId,
      txHash,
      blockNumber: args.blockNumber,
      updatedAt: now,
    });
    return;
  }
  await ctx.db.patch("seatIndex", existing._id, {
    minted: true,
    ownerAddress,
    tokenId: args.tokenId,
    txHash,
    blockNumber: args.blockNumber,
    updatedAt: now,
  });
}
