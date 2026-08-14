import { describe, expect, it } from "vitest";
import { normalizeHandle } from "../../app/lib/booking/handle";
import { utf8ByteLength, validateName } from "../../app/lib/booking/name";

describe("handle normalization", () => {
  it("strips a leading @ and trims", () => {
    expect(normalizeHandle("  @alice  ")).toEqual({ ok: true, value: "alice" });
    expect(normalizeHandle("alice")).toEqual({ ok: true, value: "alice" });
    expect(normalizeHandle("")).toEqual({ ok: true, value: "" });
  });

  it("rejects whitespace, control characters, and oversize handles", () => {
    expect(normalizeHandle("ali ce").ok).toBe(false);
    expect(normalizeHandle("ali\nce").ok).toBe(false);
    expect(normalizeHandle("a".repeat(33)).ok).toBe(false);
    expect(normalizeHandle("é".repeat(16)).ok).toBe(true);
    expect(normalizeHandle("é".repeat(17)).ok).toBe(false);
  });
});

describe("name validation", () => {
  it("measures UTF-8 bytes, not string length", () => {
    expect(utf8ByteLength("é")).toBe(2);
    expect("é".length).toBe(1);
    expect(validateName("Ada Lovelace").ok).toBe(true);
    expect(validateName("").ok).toBe(false);
    expect(validateName("é".repeat(24)).ok).toBe(true);
    expect(validateName("é".repeat(25)).ok).toBe(false);
    expect(validateName("A".repeat(49)).ok).toBe(false);
  });
});
