import { describe, expect, it } from "vitest";
import {
  canonicalHandle,
  dobValidationMessage,
  nameValidationMessage,
  travelerFieldErrors,
  travelerFieldsAreValid,
} from "../../app/lib/booking/travelerFields";

describe("traveler form normalization and validation", () => {
  it("normalizes @user to user", () => {
    expect(canonicalHandle("@user")).toBe("user");
    expect(canonicalHandle("user")).toBe("user");
    expect(canonicalHandle("  @@Ada  ")).toBe("Ada");
  });

  it("rejects a 49-byte name with a plain-language message", () => {
    const tooLong = "A".repeat(49);
    expect(nameValidationMessage(tooLong)).toMatch(/little long/i);
    expect(travelerFieldsAreValid(travelerFieldErrors({
      fullName: tooLong,
      dateOfBirthISO: "1998-05-12",
      twitterHandle: "ada",
    }))).toBe(false);
  });

  it("rejects 1998-02-29 as a real calendar date", () => {
    expect(dobValidationMessage("1998-02-29")).toMatch(/real calendar date/i);
    expect(
      travelerFieldErrors({
        fullName: "Ada Lovelace",
        dateOfBirthISO: "1998-02-29",
        twitterHandle: "",
      }).dateOfBirthISO,
    ).not.toBeNull();
  });
});
