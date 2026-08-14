import { describe, expect, it } from "vitest";
import { applySelectSeat, applySetBags, createBookingState, derivedTotalWei } from "../../app/lib/booking/state";
import {
  applyContractAvailability,
  applyConvexSeatIndex,
} from "../../app/lib/booking/availability";
import { clampBagCount } from "../../app/lib/booking/bags";
import { BAG_PRICE_WEI, FLIGHT, MAX_BAGS } from "../../app/lib/booking/flight";
import { CABIN_SECTIONS } from "../../app/lib/booking/seatMapLayout";
import { quoteWei, seatPriceWei, SEAT_PRICES_WEI } from "../../app/lib/booking/seatPricing";
import {
  neighborSeatId,
  nextSelectedSeatId,
  seatAriaLabel,
  seatIsDisabled,
  seatTooltip,
  seatVisualState,
} from "../../app/lib/booking/seatVisual";
import { SEATS, seatById } from "../../app/lib/booking/seats";
import { formatEth } from "../../app/lib/format/eth";
import { readChainSeatAvailability } from "../../app/lib/evm/seatAvailability";

const seat12A = seatById(121)!;

describe("seat map availability", () => {
  it("does not mark seats available from Convex before the contract read", () => {
    const map = applyConvexSeatIndex(
      new Map(),
      [
        { seatId: 121, minted: false },
        { seatId: 122, minted: true },
      ],
      false,
    );
    expect(map.get(121)).toBeUndefined();
    expect(map.get(122)).toBe(false);
    expect(
      seatVisualState({
        status: "loading",
        available: map.get(121),
        selected: false,
      }),
    ).toBe("loading");
  });

  it("lets the contract result win, then Convex minted updates occupy seats", () => {
    let map = applyConvexSeatIndex(
      new Map(),
      [{ seatId: 121, minted: true }],
      false,
    );
    map = applyContractAvailability(map, [121, 122], [true, true]);
    expect(map.get(121)).toBe(true);
    expect(map.get(122)).toBe(true);
    map = applyConvexSeatIndex(
      map,
      [{ seatId: 121, minted: true }],
      true,
    );
    expect(map.get(121)).toBe(false);
    expect(map.get(122)).toBe(true);
  });

  it("renders no available seats while loading", () => {
    expect(
      SEATS.every((seat) => {
        const state = seatVisualState({
          status: "loading",
          available: undefined,
          selected: false,
        });
        return state === "loading" && seat.seatId > 0;
      }),
    ).toBe(true);
  });
});

describe("seat visual states", () => {
  it("disables occupied seats and ignores selection", () => {
    const occupied = seatVisualState({
      status: "ready",
      available: false,
      selected: false,
    });
    expect(occupied).toBe("occupied");
    expect(seatIsDisabled(occupied)).toBe(true);
    expect(nextSelectedSeatId(undefined, 121, occupied)).toBeUndefined();
  });

  it("toggles the selected seat", () => {
    const available = seatVisualState({
      status: "ready",
      available: true,
      selected: false,
    });
    const selected = seatVisualState({
      status: "ready",
      available: true,
      selected: true,
    });
    expect(nextSelectedSeatId(undefined, 121, available)).toBe(121);
    expect(nextSelectedSeatId(121, 46, available)).toBe(46);
    expect(nextSelectedSeatId(121, 121, selected)).toBeUndefined();
  });

  it("uses exact ARIA label strings", () => {
    const price = formatEth(seatPriceWei(121));
    expect(price).toBe("0.009");
    expect(seatAriaLabel(seat12A, "available", price)).toBe(
      "Seat 12A, Window, 0.009 ETH, available",
    );
    expect(seatAriaLabel(seat12A, "selected", price)).toBe(
      "Seat 12A, Window, 0.009 ETH, available",
    );
    expect(seatAriaLabel(seat12A, "occupied", price)).toBe(
      "Seat 12A, unavailable",
    );
    expect(seatTooltip(seat12A, price)).toBe("12A / Window / 0.009 ETH");
  });
});

describe("seat map geometry", () => {
  it("lays out 2-2 first class and 3-3 remaining cabins with exit rows 10–11", () => {
    const first = CABIN_SECTIONS.find((section) => section.cabin === "First");
    const exit = CABIN_SECTIONS.find((section) => section.cabin === "Exit");
    const main = CABIN_SECTIONS.find((section) => section.cabin === "Main");
    expect(first?.heading).toBe("FIRST CLASS");
    expect(exit?.heading).toBe("EMERGENCY EXIT");
    expect(main?.heading).toBe("MAIN CABIN");
    expect(exit?.rows.map((row) => row.row)).toEqual([10, 11]);

    const firstRow = first?.rows[0]?.cells.filter((cell) => cell.kind === "seat") ?? [];
    expect(firstRow.map((cell) => cell.kind === "seat" && cell.seat.column)).toEqual([
      "A",
      "C",
      "D",
      "F",
    ]);

    const mainRow = main?.rows[0]?.cells.filter((cell) => cell.kind === "seat") ?? [];
    expect(mainRow.map((cell) => cell.kind === "seat" && cell.seat.column)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
    ]);

    const seatCount = CABIN_SECTIONS.reduce(
      (sum, section) =>
        sum +
        section.rows.reduce(
          (rowSum, row) =>
            rowSum + row.cells.filter((cell) => cell.kind === "seat").length,
          0,
        ),
      0,
    );
    expect(seatCount).toBe(184);
    expect(SEAT_PRICES_WEI.size).toBe(184);
  });

  it("moves between seats with arrow-key neighbors", () => {
    expect(neighborSeatId(121, "right")).toBe(122);
    expect(neighborSeatId(123, "right")).toBe(124);
    expect(neighborSeatId(11, "right")).toBe(13);
    expect(neighborSeatId(101, "down")).toBe(111);
  });
});

describe("checked bags and totals", () => {
  it("clamps bags and recomputes base + seat + bags in wei", () => {
    expect(clampBagCount(-2)).toBe(0);
    expect(clampBagCount(MAX_BAGS + 8)).toBe(MAX_BAGS);

    const state = createBookingState("bags");
    expect(derivedTotalWei(state)).toBe(FLIGHT.baseFareWei);
    applySelectSeat(state, 121);
    expect(derivedTotalWei(state)).toBe(FLIGHT.baseFareWei + seatPriceWei(121));
    applySetBags(state, 2);
    expect(derivedTotalWei(state)).toBe(quoteWei(121, 2));
    expect(derivedTotalWei(state)).toBe(
      FLIGHT.baseFareWei + seatPriceWei(121) + BAG_PRICE_WEI * 2n,
    );
  });
});

describe("availability stub", () => {
  it("reports every seat available without implying a loaded UI", async () => {
    const result = await readChainSeatAvailability([11, 121, 326]);
    expect(result).toEqual([true, true, true]);
  });
});
