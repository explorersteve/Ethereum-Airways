import {
  seatById,
  seatExists,
  type Column,
  type Seat,
} from "./seats";

export type SeatVisualState =
  | "loading"
  | "available"
  | "selected"
  | "occupied";

export type AvailabilityStatus = "loading" | "ready" | "error";

const COLUMN_ORDER: readonly Column[] = ["A", "B", "C", "D", "E", "F"];
const COLUMN_CODE: Record<Column, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
};

export function seatVisualState(args: {
  status: AvailabilityStatus;
  available: boolean | undefined;
  selected: boolean;
}): SeatVisualState {
  if (args.available === false) {
    return "occupied";
  }
  if (args.status === "loading" && args.available !== true) {
    return "loading";
  }
  if (args.selected) {
    return "selected";
  }
  if (args.available === true || args.status === "ready" || args.status === "error") {
    return "available";
  }
  return "loading";
}

export function seatIsDisabled(state: SeatVisualState): boolean {
  return state === "occupied" || state === "loading";
}

export function seatAriaLabel(
  seat: Seat,
  state: SeatVisualState,
  priceEth: string,
): string {
  if (state === "occupied") {
    return `Seat ${seat.label}, unavailable`;
  }
  if (state === "loading") {
    return `Seat ${seat.label}, loading`;
  }
  return `Seat ${seat.label}, ${seat.position}, ${priceEth} ETH, available`;
}

export function seatTooltip(seat: Seat, priceEth: string): string {
  return `${seat.label} / ${seat.position} / ${priceEth} ETH`;
}

export function nextSelectedSeatId(
  current: number | undefined,
  clicked: number,
  state: SeatVisualState,
): number | undefined {
  if (state === "selected" && current === clicked) {
    return undefined;
  }
  if (state !== "available" && state !== "selected") {
    return current;
  }
  return clicked;
}

function seatIdAt(row: number, column: Column): number {
  return row * 10 + COLUMN_CODE[column];
}

function nearestInColumn(
  column: Column,
  fromRow: number,
  step: 1 | -1,
): number | undefined {
  for (let row = fromRow + step; row >= 1 && row <= 32; row += step) {
    const seatId = seatIdAt(row, column);
    if (seatExists(seatId)) {
      return seatId;
    }
  }
  return undefined;
}

function nearestInRow(
  row: number,
  fromColumn: Column,
  step: 1 | -1,
): number | undefined {
  const start = COLUMN_ORDER.indexOf(fromColumn);
  for (let i = start + step; i >= 0 && i < COLUMN_ORDER.length; i += step) {
    const column = COLUMN_ORDER[i];
    if (!column) {
      continue;
    }
    const seatId = seatIdAt(row, column);
    if (seatExists(seatId)) {
      return seatId;
    }
  }
  return undefined;
}

export function neighborSeatId(
  seatId: number,
  direction: "left" | "right" | "up" | "down",
): number | undefined {
  const seat = seatById(seatId);
  if (!seat) {
    return undefined;
  }
  if (direction === "left") {
    return nearestInRow(seat.row, seat.column, -1);
  }
  if (direction === "right") {
    return nearestInRow(seat.row, seat.column, 1);
  }
  if (direction === "up") {
    return nearestInColumn(seat.column, seat.row, -1);
  }
  return nearestInColumn(seat.column, seat.row, 1);
}
