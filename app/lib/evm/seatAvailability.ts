import { SEAT_IDS } from "../booking/seats";

/**
 * Batched `getSeatAvailability(seatIds)` reader.
 * Plan 12 replaces `readChainSeatAvailability` with a real `eth_call`.
 */
export type ReadSeatAvailability = (
  seatIds: readonly number[],
) => Promise<readonly boolean[]>;

/** Dev stub: every known seat is available. Never used as a loading default. */
export const readChainSeatAvailability: ReadSeatAvailability = async (
  seatIds: readonly number[] = SEAT_IDS,
) => seatIds.map(() => true);
