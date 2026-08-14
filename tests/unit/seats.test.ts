import { describe, expect, it } from "vitest";
import {
  priorityLabel,
  rowsByCabin,
  SEAT_IDS,
  SEATS,
  seatById,
  seatExists,
  seatLabel,
} from "../../app/lib/booking/seats";

describe("seat geometry", () => {
  it("generates exactly 184 seats", () => {
    expect(SEATS).toHaveLength(184);
    expect(SEAT_IDS).toHaveLength(184);
  });

  it("has no B or E columns in rows 1–4", () => {
    const first = SEATS.filter((seat) => seat.row <= 4);
    expect(first.every((seat) => seat.column !== "B" && seat.column !== "E")).toBe(
      true,
    );
    expect(first).toHaveLength(16);
    expect(seatExists(12)).toBe(false);
    expect(seatExists(15)).toBe(false);
  });

  it("maps documented seat ids", () => {
    expect(seatById(11)?.label).toBe("1A");
    expect(seatById(13)?.label).toBe("1C");
    expect(seatById(46)?.label).toBe("4F");
    expect(seatById(121)?.label).toBe("12A");
    expect(seatById(184)?.label).toBe("18D");
    expect(seatById(326)?.label).toBe("32F");
    expect(seatLabel(11)).toBe("1A");
  });

  it("rejects seats that do not exist", () => {
    expect(seatExists(12)).toBe(false);
    expect(seatExists(0)).toBe(false);
    expect(seatExists(331)).toBe(false);
    expect(() => seatLabel(12)).toThrow("Invalid seat");
  });

  it("assigns cabins, positions, and priority labels", () => {
    expect(seatById(11)?.cabin).toBe("First");
    expect(seatById(11)?.position).toBe("Window");
    expect(priorityLabel(seatById(11)!)).toBe("First Class");
    expect(priorityLabel(seatById(51)!)).toBe("Comfort");
    expect(priorityLabel(seatById(101)!)).toBe("Emergency Exit Row");
    expect(priorityLabel(seatById(121)!)).toBe("Window");
    expect(priorityLabel(seatById(122)!)).toBe("Middle");
    expect(priorityLabel(seatById(123)!)).toBe("Aisle");
    expect(priorityLabel(seatById(321)!)).toBe("Rear Window");
    expect(priorityLabel(seatById(322)!)).toBe("Rear Middle");
    expect(priorityLabel(seatById(323)!)).toBe("Rear Aisle");
  });

  it("groups rows by cabin", () => {
    expect(rowsByCabin.First.map((row) => row.row)).toEqual([1, 2, 3, 4]);
    expect(rowsByCabin.Comfort.map((row) => row.row)).toEqual([5, 6, 7, 8, 9]);
    expect(rowsByCabin.Exit.map((row) => row.row)).toEqual([10, 11]);
    expect(rowsByCabin.Main).toHaveLength(13);
    expect(rowsByCabin.Rear).toHaveLength(8);
    expect(rowsByCabin.First[0]?.seats.map((seat) => seat.column)).toEqual([
      "A",
      "C",
      "D",
      "F",
    ]);
  });

  it("exposes sorted seat ids for batch availability", () => {
    expect(SEAT_IDS[0]).toBe(11);
    expect(SEAT_IDS[SEAT_IDS.length - 1]).toBe(326);
    expect([...SEAT_IDS].sort((a, b) => a - b)).toEqual([...SEAT_IDS]);
  });
});
