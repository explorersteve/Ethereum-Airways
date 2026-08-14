export const FLIGHT = {
  flightNumber: "ETH001" as const,
  origin: "Current Location" as const,
  destination: "Ethereum" as const,
  tripType: "Round Trip" as const,
  departure: "Now" as const,
  baseFareWei: "1000000000000000",
};

export const MAX_BAGS = 65_535;

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
      seats.push({
        seatId: row * 10 + columnCode,
        row,
        column,
        columnCode,
        cabin,
        position: positionForColumn(column),
        label: `${row}${column}`,
      });
    }
  }
  return seats;
}

const generated = generateSeats();
const byId = new Map(generated.map((seat) => [seat.seatId, seat]));

export const SEATS: readonly Seat[] = generated;

export function seatById(seatId: number): Seat | undefined {
  return byId.get(seatId);
}

export function seatExists(seatId: number): boolean {
  return byId.has(seatId);
}

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
