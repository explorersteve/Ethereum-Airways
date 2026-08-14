/**
 * Display-only mirror of BoardingPass / SeatLib pricing.
 * The contract is authoritative. Never submit these values as payment.
 *
 * All arithmetic is bigint wei. Integer division in middle-seat formulas is
 * deliberate and must match Solidity (`wa * 2 / 3` and `wa / 2`).
 *
 * Exact Main middle wei (window/aisle * 2 / 3, truncated):
 *   12: 6000000000000000
 *   13: 5666666666666666
 *   14: 5333333333333333
 *   15: 5000000000000000
 *   16: 4666666666666666
 *   17: 4333333333333333
 *   18: 4000000000000000
 *   19: 3666666666666666
 *   20: 3333333333333333
 *   21: 3000000000000000
 *   22: 2666666666666666
 *   23: 2333333333333333
 *   24: 2000000000000000
 */

import { BAG_PRICE_WEI, FLIGHT, MAX_BAGS } from "./flight";
import { SEATS, seatById } from "./seats";

const FIRST_BASE_WEI = 60_000_000_000_000_000n;
const FIRST_STEP_WEI = 5_000_000_000_000_000n;
const COMFORT_BASE_WEI = 30_000_000_000_000_000n;
const COMFORT_STEP_WEI = 2_000_000_000_000_000n;
const EXIT_ROW_10_WEI = 18_000_000_000_000_000n;
const EXIT_ROW_11_WEI = 16_000_000_000_000_000n;
const MAIN_BASE_WEI = 9_000_000_000_000_000n;
const MAIN_STEP_WEI = 500_000_000_000_000n;
const REAR_BASE_WEI = 1_000_000_000_000_000n;
const REAR_STEP_WEI = 120_000_000_000_000n;

export function seatPriceWei(seatId: number): bigint {
  const seat = seatById(seatId);
  if (!seat) {
    throw new Error(`Invalid seat: ${seatId}`);
  }

  const row = BigInt(seat.row);

  if (seat.cabin === "First") {
    return FIRST_BASE_WEI - (row - 1n) * FIRST_STEP_WEI;
  }
  if (seat.cabin === "Comfort") {
    return COMFORT_BASE_WEI - (row - 5n) * COMFORT_STEP_WEI;
  }
  if (seat.cabin === "Exit") {
    return seat.row === 10 ? EXIT_ROW_10_WEI : EXIT_ROW_11_WEI;
  }
  if (seat.cabin === "Main") {
    const windowOrAisle = MAIN_BASE_WEI - (row - 12n) * MAIN_STEP_WEI;
    if (seat.position === "Middle") {
      return (windowOrAisle * 2n) / 3n;
    }
    return windowOrAisle;
  }

  const windowOrAisle = REAR_BASE_WEI - (row - 25n) * REAR_STEP_WEI;
  if (seat.position === "Middle") {
    return windowOrAisle / 2n;
  }
  return windowOrAisle;
}

export function quoteWei(seatId: number, bagCount: number): bigint {
  if (!Number.isInteger(bagCount) || bagCount < 0 || bagCount > MAX_BAGS) {
    throw new Error(`Invalid bag count: ${bagCount}`);
  }
  return (
    FLIGHT.baseFareWei +
    seatPriceWei(seatId) +
    BAG_PRICE_WEI * BigInt(bagCount)
  );
}

/** Frozen per-seat prices so the map never recomputes 184 formulas on bag changes. */
export const SEAT_PRICES_WEI: ReadonlyMap<number, bigint> = new Map(
  SEATS.map((seat) => [seat.seatId, seatPriceWei(seat.seatId)]),
);
