# Plan 03 — Domain constants, seat geometry, booking state

## Goal

Own the product domain in TypeScript: flight constants, generated 184-seat geometry, the
deterministic price mirror, DOB/handle normalization, and the booking state composable.
Pure logic, fully unit tested, no contract dependency yet.

## Prerequisites

Plan 01 done.

## Tasks

1. `app/lib/booking/flight.ts`:
   ```ts
   export const FLIGHT = {
     flightNumber: 'ETH001', origin: 'Current Location', destination: 'Ethereum',
     tripType: 'Round Trip', departure: 'Now', travelers: 1,
     baseFareWei: 1_000_000_000_000_000n,
   } as const
   export const BAG_PRICE_WEI = 10_000_000_000_000_000n
   export const MAX_BAGS = 65_535
   ```
2. `app/lib/booking/seats.ts` — generate seats programmatically from row rules, never hand-typed:
   - rows 1–4 First, columns `A C D F` (2-2)
   - rows 5–9 Comfort, rows 10–11 Exit, rows 12–24 Main, rows 25–32 Rear, all `A B C D E F` (3-3)
   - `seatId = row * 10 + columnCode` where `A=1 … F=6`
   - positions: `A/F` window, `B/E` middle, `C/D` aisle
   - exports: `SEATS` (frozen array of 184), `seatById`, `seatExists`, `seatLabel`,
     `rowsByCabin`, `SEAT_IDS` (sorted `uint16[]` for the batch availability call)
   - `priorityLabel(seat)` → `First Class | Comfort | Emergency Exit Row | Window | Aisle |
     Middle | Rear Window | Rear Aisle | Rear Middle`, cabin label first
3. `app/lib/booking/seatPricing.ts` — bigint-only mirror of the contract formula:
   - First: `0.060 ETH - (row - 1) * 0.005 ETH`
   - Comfort: `0.030 ETH - (row - 5) * 0.002 ETH`
   - Exit: row 10 = `0.018 ETH`, row 11 = `0.016 ETH`
   - Main window/aisle: `0.009 ETH - (row - 12) * 0.0005 ETH`; main middle: `* 2n / 3n`
   - Rear window/aisle: `0.001 ETH - (row - 25) * 0.00012 ETH`; rear middle: `/ 2n`
   - `quoteWei(seatId, bagCount)` = base + seat + bags
   - File header comment: display-only mirror, contract is authoritative.
4. `app/lib/booking/dob.ts` — `isoToUint32('1998-05-12') → 19980512`, `uint32ToIso`,
   `birthdayLabel → 'MAY 12'`, real calendar validation (month bounds, days per month,
   February, leap years). `app/lib/booking/handle.ts` — strip leading `@`, trim, reject
   whitespace/control chars, enforce <= 32 UTF-8 bytes. `app/lib/booking/name.ts` — 1–48 UTF-8
   bytes measured with `TextEncoder`, not `.length`.
5. `app/lib/format/eth.ts` (`formatEther` wrappers, fixed decimal presentation) and
   `app/lib/format/address.ts` (`0x12A4…9F82`).
6. `app/composables/useBooking.ts` backed by `useState`:
   - state shape exactly as the brief's `BookingState`
   - `sessionId` generated once via `crypto.randomUUID()`, persisted in `localStorage`
   - persistence layer serializes every `bigint` as a decimal string and rehydrates to `bigint`;
     never `JSON.stringify` a bigint
   - actions: `selectFlight`, `setTraveler`, `selectSeat`, `clearSeat`, `setBags`,
     `setQuote`, `setResult`, `reset`
   - derived: `seat`, `seatPriceWei`, `bagsTotalWei`, `totalWei`, `isTravelerComplete`,
     `canReview`
   - no traveler PII in URLs or query params
7. Unit tests in `tests/unit/`: seat count is exactly 184; no `B`/`E` in rows 1–4; spot seat ids
   (`1A=11, 1C=13, 4F=46, 12A=121, 18D=184, 32F=326`); every documented price from brief §83;
   the full hierarchy invariant First > Comfort > Exit > Main W/A > Main Middle > Rear; DOB round
   trip and leap-year rejection; handle normalization; bigint persistence round trip.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm lint
```

## Done criteria

- 184 seats generated; all brief §82/§83 assertions pass.
- No floating-point arithmetic anywhere in pricing or totals.
- Booking state survives a simulated reload in tests, with bigints intact.
- Zero `any` in the new files.

## Commit

`feat: flight constants, seat geometry, price mirror, and booking state`
