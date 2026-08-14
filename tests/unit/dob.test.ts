import { describe, expect, it } from "vitest";
import {
  birthdayLabel,
  isoToUint32,
  uint32ToIso,
} from "../../app/lib/booking/dob";

describe("date of birth", () => {
  it("round-trips ISO and uint32", () => {
    expect(isoToUint32("1998-05-12")).toBe(19980512);
    expect(uint32ToIso(19980512)).toBe("1998-05-12");
    expect(birthdayLabel("1998-05-12")).toBe("MAY 12");
  });

  it("rejects non-leap February 29 and accepts real leap days", () => {
    expect(() => isoToUint32("1998-02-29")).toThrow("Invalid date of birth");
    expect(() => isoToUint32("1900-02-29")).toThrow("Invalid date of birth");
    expect(isoToUint32("2000-02-29")).toBe(20000229);
    expect(uint32ToIso(20000229)).toBe("2000-02-29");
  });

  it("rejects impossible months and days", () => {
    expect(() => isoToUint32("1998-00-12")).toThrow();
    expect(() => isoToUint32("1998-13-01")).toThrow();
    expect(() => isoToUint32("1998-04-31")).toThrow();
    expect(() => isoToUint32("1998-01-00")).toThrow();
    expect(() => uint32ToIso(19980229)).toThrow();
  });
});
