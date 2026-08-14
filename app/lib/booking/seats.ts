export type Cabin = "First" | "Comfort" | "Exit" | "Main" | "Rear";
export type SeatPosition = "Window" | "Middle" | "Aisle";
export type Column = "A" | "B" | "C" | "D" | "E" | "F";

export type Seat = {
  seatId: number;
  row: number;
  column: Column;
  columnCode: number;
  cabin: Cabin;
  position: SeatPosition;
  label: string;
};

export type PriorityLabel =
  | "First Class"
  | "Comfort"
  | "Emergency Exit Row"
  | "Window"
  | "Aisle"
  | "Middle"
  | "Rear Window"
  | "Rear Aisle"
  | "Rear Middle";

const ALL_COLUMNS = ["A", "B", "C", "D", "E", "F"] as const;
const FIRST_COLUMNS = ["A", "C", "D", "F"] as const;

const COLUMN_CODE: Record<Column, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
};

function cabinForRow(row: number): Cabin {
  if (row <= 4) return "First";
  if (row <= 9) return "Comfort";
  if (row <= 11) return "Exit";
  if (row <= 24) return "Main";
  return "Rear";
}

function columnsForRow(row: number): readonly Column[] {
  return row <= 4 ? FIRST_COLUMNS : ALL_COLUMNS;
}

function positionForColumn(column: Column): SeatPosition {
  if (column === "A" || column === "F") return "Window";
  if (column === "B" || column === "E") return "Middle";
  return "Aisle";
}

function generateSeats(): Seat[] {
  const seats: Seat[] = [];
  for (let row = 1; row <= 32; row += 1) {
    const cabin = cabinForRow(row);
    for (const column of columnsForRow(row)) {
      const columnCode = COLUMN_CODE[column];
      const seatId = row * 10 + columnCode;
      seats.push(
        Object.freeze({
          seatId,
          row,
          column,
          columnCode,
          cabin,
          position: positionForColumn(column),
          label: `${row}${column}`,
        }),
      );
    }
  }
  return seats;
}

function groupRowsByCabin(
  seats: readonly Seat[],
): Record<Cabin, readonly { row: number; seats: readonly Seat[] }[]> {
  const cabins: Cabin[] = ["First", "Comfort", "Exit", "Main", "Rear"];
  const grouped = {} as Record<
    Cabin,
    { row: number; seats: Seat[] }[]
  >;
  for (const cabin of cabins) {
    grouped[cabin] = [];
  }
  for (const seat of seats) {
    const rows = grouped[seat.cabin];
    const last = rows[rows.length - 1];
    if (last && last.row === seat.row) {
      last.seats.push(seat);
    } else {
      rows.push({ row: seat.row, seats: [seat] });
    }
  }
  return Object.freeze({
    First: Object.freeze(grouped.First.map(freezeRow)),
    Comfort: Object.freeze(grouped.Comfort.map(freezeRow)),
    Exit: Object.freeze(grouped.Exit.map(freezeRow)),
    Main: Object.freeze(grouped.Main.map(freezeRow)),
    Rear: Object.freeze(grouped.Rear.map(freezeRow)),
  });
}

function freezeRow(row: { row: number; seats: Seat[] }) {
  return Object.freeze({
    row: row.row,
    seats: Object.freeze(row.seats),
  });
}

const generated = generateSeats();
const byId = new Map<number, Seat>(generated.map((seat) => [seat.seatId, seat]));

export const SEATS: readonly Seat[] = Object.freeze(generated);

export const SEAT_IDS: readonly number[] = Object.freeze(
  generated.map((seat) => seat.seatId),
);

export const rowsByCabin = groupRowsByCabin(SEATS);

export function seatById(seatId: number): Seat | undefined {
  return byId.get(seatId);
}

export function seatExists(seatId: number): boolean {
  return byId.has(seatId);
}

export function seatLabel(seatId: number): string {
  const seat = byId.get(seatId);
  if (!seat) {
    throw new Error(`Invalid seat: ${seatId}`);
  }
  return seat.label;
}

export function priorityLabel(seat: Seat): PriorityLabel {
  if (seat.cabin === "First") return "First Class";
  if (seat.cabin === "Comfort") return "Comfort";
  if (seat.cabin === "Exit") return "Emergency Exit Row";
  if (seat.cabin === "Rear") {
    if (seat.position === "Window") return "Rear Window";
    if (seat.position === "Aisle") return "Rear Aisle";
    return "Rear Middle";
  }
  return seat.position;
}
