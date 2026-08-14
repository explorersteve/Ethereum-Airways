import { rowsByCabin, type Cabin, type Column, type Seat } from "./seats";

export const GRID_SLOTS = ["A", "B", "C", "aisle", "D", "E", "F"] as const;
export type GridSlot = (typeof GRID_SLOTS)[number];

export type LayoutCell =
  | { kind: "aisle" }
  | { kind: "empty"; slot: Column }
  | { kind: "seat"; seat: Seat };

export type LayoutRow = {
  row: number;
  cells: readonly LayoutCell[];
};

export type CabinSection = {
  cabin: Cabin;
  heading: "FIRST CLASS" | "COMFORT" | "EMERGENCY EXIT" | "MAIN CABIN" | "REAR CABIN";
  rows: readonly LayoutRow[];
};

function cellsForRow(seats: readonly Seat[]): readonly LayoutCell[] {
  const byColumn = new Map<Column, Seat>(
    seats.map((seat) => [seat.column, seat]),
  );
  return Object.freeze(
    GRID_SLOTS.map((slot): LayoutCell => {
      if (slot === "aisle") {
        return Object.freeze({ kind: "aisle" });
      }
      const seat = byColumn.get(slot);
      if (seat) {
        return Object.freeze({ kind: "seat", seat });
      }
      return Object.freeze({ kind: "empty", slot });
    }),
  );
}

function toLayoutRows(
  rows: readonly { row: number; seats: readonly Seat[] }[],
): readonly LayoutRow[] {
  return Object.freeze(
    rows.map((entry) =>
      Object.freeze({
        row: entry.row,
        cells: cellsForRow(entry.seats),
      }),
    ),
  );
}

/** Static cabin geometry. Defined at module scope so bag-count updates never rebuild it. */
export const CABIN_SECTIONS: readonly CabinSection[] = Object.freeze([
  Object.freeze({
    cabin: "First",
    heading: "FIRST CLASS",
    rows: toLayoutRows(rowsByCabin.First),
  }),
  Object.freeze({
    cabin: "Comfort",
    heading: "COMFORT",
    rows: toLayoutRows(rowsByCabin.Comfort),
  }),
  Object.freeze({
    cabin: "Exit",
    heading: "EMERGENCY EXIT",
    rows: toLayoutRows(rowsByCabin.Exit),
  }),
  Object.freeze({
    cabin: "Main",
    heading: "MAIN CABIN",
    rows: toLayoutRows(rowsByCabin.Main),
  }),
  Object.freeze({
    cabin: "Rear",
    heading: "REAR CABIN",
    rows: toLayoutRows(rowsByCabin.Rear),
  }),
]);
