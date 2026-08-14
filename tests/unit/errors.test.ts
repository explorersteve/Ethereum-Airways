import { describe, expect, it, vi } from "vitest";
import { UserRejectedRequestError } from "viem";
import { decodeBookingError } from "../../app/lib/evm/errors";
import { bookingLiveMessage } from "../../app/lib/evm/txCopy";

const SELECTOR = "0x3e515d4a";

describe("decodeBookingError", () => {
  it("maps custom errors to airline copy without selectors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const cases = [
      ["SeatAlreadyClaimed", "This seat was just claimed. Please choose another seat."],
      ["IncorrectPayment", "The fare changed. We've refreshed your total."],
      ["VesselCraftLocked", "Booking is temporarily unavailable."],
      ["VesselDelegateMismatch", "Booking is temporarily unavailable."],
      ["VesselCraftNotVault", "Booking is temporarily unavailable."],
      ["InvalidDateOfBirth", "Please check your date of birth."],
    ] as const;

    for (const [name, message] of cases) {
      const decoded = decodeBookingError({
        name: "ContractFunctionExecutionError",
        cause: { data: { errorName: name } },
      });
      expect(decoded.message).toBe(message);
      expect(decoded.message).not.toMatch(/0x[a-fA-F0-9]{8}/);
    }
    spy.mockRestore();
  });

  it("maps wallet rejection", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const decoded = decodeBookingError(
      new UserRejectedRequestError(new Error("user rejected")),
    );
    expect(decoded.message).toBe("Booking canceled. No charge was made.");
    spy.mockRestore();
  });

  it("never renders a selector hex for unknown errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const decoded = decodeBookingError(new Error(SELECTOR));
    expect(decoded.message).not.toContain(SELECTOR);
    expect(decoded.message).not.toMatch(/0x[a-fA-F0-9]{8}/);
    spy.mockRestore();
  });
});

describe("booking live copy", () => {
  it("uses airline language for transaction states", () => {
    expect(bookingLiveMessage("requesting")).toBe(
      "Confirm your booking in your wallet",
    );
    expect(bookingLiveMessage("waiting")).toBe("Booking your flight…");
    expect(bookingLiveMessage("complete")).toBe(
      "You're cleared for Ethereum.",
    );
  });
});
