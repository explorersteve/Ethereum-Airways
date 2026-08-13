# Plan 04 — Solidity SeatLib and pricing

## Goal

One authoritative Solidity source of seat geometry and pricing, tested to exhaustion before any
contract depends on it.

## Prerequisites

Plan 00 done. Read `https://ethskills.com/security/SKILL.md` and
`https://ethskills.com/testing/SKILL.md` before writing code, and record the applicable checklist
in `contracts/SECURITY-CHECKLIST.md` (access control, reentrancy, external calls, exact payment,
storage layout, input validation, ERC-721 behavior, metadata safety, casts, deployment safety,
fuzz/invariant expectations, Vessel external-call assumptions).

## Tasks

1. `contracts/src/libraries/SeatLib.sol`, all `internal pure`:
   - `enum Cabin { First, Comfort, Exit, Main, Rear }`
   - `enum SeatPosition { Window, Middle, Aisle }`
   - `row(uint16 seatId) → uint16` = `seatId / 10`; `col(uint16 seatId) → uint8` = `seatId % 10`
   - `exists(uint16 seatId)`: row 1–32, col 1–6, and col not 2 or 5 when row <= 4
   - `cabin(uint16)`, `position(uint16)`, `label(uint16) → "12A"`,
     `priorityLabel(uint16) → "Emergency Exit Row"` etc. (same strings as the TS mirror)
   - `price(uint16) → uint256` implementing exactly:
     - First: `0.060 ether - (row - 1) * 0.005 ether`
     - Comfort: `0.030 ether - (row - 5) * 0.002 ether`
     - Exit: row 10 `0.018 ether`, row 11 `0.016 ether`
     - Main W/A: `0.009 ether - (row - 12) * 0.0005 ether`; Main middle: `wa * 2 / 3`
     - Rear W/A: `0.001 ether - (row - 25) * 0.00012 ether`; Rear middle: `wa / 2`
   - every public entry point reverts `InvalidSeat(uint16)` for non-existent seats; no silent zero
2. Integer division is deliberate in the middle-seat formulas. Document the exact expected wei
   values in comments so the TS mirror and Solidity cannot drift silently.
3. `contracts/src/libraries/DateLib.sol` — `isValid(uint32 yyyymmdd)` with month bounds, per-month
   days, leap-year rule; `split(uint32) → (year, month, day)`; `monthName(uint8) → "MAY"`.
4. `contracts/test/SeatLib.t.sol`:
   - existence table from brief §82 (`1A` valid, `1B` invalid, `4F` valid, `5B` valid,
     `10E` valid, `12A` valid, `32F` valid, `33A` invalid, `0A` invalid)
   - exhaustive loop over all `uint16` 0–999 asserting `exists` matches an independent
     row/column rule implementation, and that the valid count is exactly **184**
   - every price assertion from brief §83
   - position mapping A/F window, C/D aisle, B/E middle
   - labels for a sample across cabins
5. `contracts/test/SeatLibFuzz.t.sol`:
   - fuzz `uint16 seatId`: if `!exists` then `price`/`label`/`cabin`/`position` revert
     `InvalidSeat`; if `exists` none of them revert
   - hierarchy invariant: min First price > max Comfort price > max Exit price > max Main
     window/aisle > max Main middle > max Rear window/aisle price, checked over all seats
   - monotonic decrease within each cabin as row increases
6. `contracts/test/DateLib.t.sol` — valid dates, `19980229` invalid, `20000229` valid,
   `19000229` invalid, month 0/13 invalid, day 0/32 invalid, month names.

## Verification

```bash
cd contracts
forge fmt --check
forge build
forge test -vv
forge test --match-path test/SeatLibFuzz.t.sol -vvv
```

## Done criteria

- Exactly 184 valid seats proven by exhaustive test, not by assertion of intent.
- All §83 prices exact to the wei.
- Hierarchy and monotonicity invariants pass under fuzzing.
- `forge fmt --check` clean; no compiler warnings.

## Commit

`feat(contracts): seat geometry, deterministic pricing, and date libraries`
