import { SEAT_IDS } from "./seats";

export type SeatIndexRow = {
  seatId: number;
  minted: boolean;
};

/**
 * Contract-shaped availability: true means the seat exists and is unminted.
 * Convex cache may mark minted seats occupied before the chain read returns,
 * but never marks seats available (avoids a flash of all-open seats).
 */
export function applyConvexSeatIndex(
  map: Map<number, boolean>,
  rows: readonly SeatIndexRow[],
  contractApplied: boolean,
): Map<number, boolean> {
  const next = new Map(map);
  for (const row of rows) {
    if (row.minted) {
      next.set(row.seatId, false);
    } else if (contractApplied && !next.has(row.seatId)) {
      next.set(row.seatId, true);
    }
  }
  return next;
}

/** Authoritative chain result. Always overwrites Convex for the same seat ids. */
export function applyContractAvailability(
  map: Map<number, boolean>,
  seatIds: readonly number[],
  available: readonly boolean[],
): Map<number, boolean> {
  const next = new Map(map);
  for (let i = 0; i < seatIds.length; i += 1) {
    const seatId = seatIds[i];
    const value = available[i];
    if (seatId === undefined || value === undefined) {
      continue;
    }
    next.set(seatId, value);
  }
  return next;
}

export function availabilityForIds(
  map: Map<number, boolean>,
  seatIds: readonly number[] = SEAT_IDS,
): boolean[] {
  return seatIds.map((seatId) => map.get(seatId) === true);
}
