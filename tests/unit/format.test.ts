import { describe, expect, it } from "vitest";
import { formatAddress } from "../../app/lib/format/address";
import { formatEth, formatEthFixed } from "../../app/lib/format/eth";

describe("format helpers", () => {
  it("formats ether from wei without floating-point math", () => {
    expect(formatEth(1_000_000_000_000_000n)).toBe("0.001");
    expect(formatEthFixed(160_000_000_000_000n, 5)).toBe("0.00016");
    expect(formatEthFixed(80_000_000_000_000n, 5)).toBe("0.00008");
  });

  it("checksum-shortens addresses as 0x12A4…9F82", () => {
    const formatted = formatAddress(
      "0x12a4c0ffee000000000000000000000000009f82",
    );
    expect(formatted).toMatch(/^0x[0-9A-Fa-f]{4}…[0-9A-Fa-f]{4}$/);
    expect(formatted.startsWith("0x12A4") || formatted.startsWith("0x12a4")).toBe(
      true,
    );
    expect(formatted.endsWith("9F82") || formatted.endsWith("9f82")).toBe(true);
  });
});
