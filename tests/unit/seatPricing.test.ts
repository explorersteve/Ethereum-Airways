import { describe, expect, it } from "vitest";
import { parseEther } from "viem";
import { BAG_PRICE_WEI, FLIGHT } from "../../app/lib/booking/flight";
import { quoteWei, seatPriceWei } from "../../app/lib/booking/seatPricing";
import { SEATS } from "../../app/lib/booking/seats";

function eth(value: string): bigint {
  return parseEther(value);
}

describe("seat pricing mirror", () => {
  it("matches every documented brief §83 price", () => {
    expect(seatPriceWei(11)).toBe(eth("0.060"));
    expect(seatPriceWei(21)).toBe(eth("0.055"));
    expect(seatPriceWei(31)).toBe(eth("0.050"));
    expect(seatPriceWei(41)).toBe(eth("0.045"));

    expect(seatPriceWei(51)).toBe(eth("0.030"));
    expect(seatPriceWei(61)).toBe(eth("0.028"));
    expect(seatPriceWei(71)).toBe(eth("0.026"));
    expect(seatPriceWei(81)).toBe(eth("0.024"));
    expect(seatPriceWei(91)).toBe(eth("0.022"));

    expect(seatPriceWei(101)).toBe(eth("0.018"));
    expect(seatPriceWei(111)).toBe(eth("0.016"));

    expect(seatPriceWei(121)).toBe(eth("0.009"));
    expect(seatPriceWei(241)).toBe(eth("0.003"));
    expect(seatPriceWei(122)).toBe(eth("0.006"));
    expect(seatPriceWei(242)).toBe(eth("0.002"));

    expect(seatPriceWei(251)).toBe(eth("0.001"));
    expect(seatPriceWei(321)).toBe(eth("0.00016"));
    expect(seatPriceWei(322)).toBe(eth("0.00008"));
  });

  it("uses truncated integer division for uneven main middles", () => {
    expect(seatPriceWei(132)).toBe(5_666_666_666_666_666n);
  });

  it("quotes base + seat + bags in wei only", () => {
    expect(quoteWei(121, 2)).toBe(
      FLIGHT.baseFareWei + eth("0.009") + BAG_PRICE_WEI * 2n,
    );
  });

  it("enforces First > Comfort > Exit > Main W/A > Main Middle > Rear", () => {
    const first = SEATS.filter((s) => s.cabin === "First").map((s) =>
      seatPriceWei(s.seatId),
    );
    const comfort = SEATS.filter((s) => s.cabin === "Comfort").map((s) =>
      seatPriceWei(s.seatId),
    );
    const exit = SEATS.filter((s) => s.cabin === "Exit").map((s) =>
      seatPriceWei(s.seatId),
    );
    const mainWA = SEATS.filter(
      (s) => s.cabin === "Main" && s.position !== "Middle",
    ).map((s) => seatPriceWei(s.seatId));
    const mainMid = SEATS.filter(
      (s) => s.cabin === "Main" && s.position === "Middle",
    ).map((s) => seatPriceWei(s.seatId));
    const rear = SEATS.filter((s) => s.cabin === "Rear").map((s) =>
      seatPriceWei(s.seatId),
    );

    const min = (values: bigint[]) => values.reduce((a, b) => (a < b ? a : b));
    const max = (values: bigint[]) => values.reduce((a, b) => (a > b ? a : b));

    expect(min(first) > max(comfort)).toBe(true);
    expect(max(comfort) > max(exit)).toBe(true);
    expect(max(exit) > max(mainWA)).toBe(true);
    expect(max(mainWA) > max(mainMid)).toBe(true);
    expect(max(mainMid) > max(rear)).toBe(true);
  });
});
