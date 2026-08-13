# Plan 11 — Seat map and extras

## Goal

The centerpiece screen. A top-down aircraft that a traveler recognizes instantly, with 184
selectable seats, real availability, and checked bags. Spend disproportionate effort here.

## Prerequisites

Plan 10 done.

## Tasks

1. `app/pages/seats.vue` — `BookingProgress step="seats"`; desktop split roughly 70% aircraft /
   30% sticky `TripSummary`; heading `Choose your seat`.
2. `AircraftSeatMap.vue` structure:
   - inline SVG fuselage **behind** the seat DOM: rounded nose, fuselage body, wings at rows 10–11,
     tail, cabin dividers, aisle channel, front and rear galley cues, subtle lavatory icons,
     `EXIT` markers at the emergency rows
   - seats are real `<button>` elements laid out with CSS Grid; First Class rows render `A C | D F`
     (2-2) and rows 5–32 render `A B C | D E F` (3-3)
   - cabin section headers: `FIRST CLASS`, `COMFORT`, `EMERGENCY EXIT`, `MAIN CABIN`, `REAR CABIN`
   - static geometry defined outside component setup so bag-count changes never re-render it
3. `AircraftSeat.vue` — props `seat`, `state`, `priceWei`; states:
   - available (clickable), hover/focus tooltip showing `12A / Window / 0.009 ETH`
   - selected: strong high-contrast fill plus a check glyph
   - occupied: muted, `disabled`, diagonal hatch pattern, label `Unavailable`
   - loading: skeleton shimmer — seats must **never** flash as available before availability
     resolves
   - never color alone: pattern/shape/icon distinctions too
   - `aria-label` exactly `Seat 12A, Window, 0.009 ETH, available` or `Seat 12A, unavailable`
   - minimum 40px hit target on mobile
4. `SeatLegend.vue` — Available / Selected / Unavailable / First / Comfort / Exit, with the same
   patterns used on the map.
5. `app/composables/useSeatAvailability.ts` — the loading strategy from brief §98:
   1. render static geometry immediately
   2. read the Convex `seatIndex` cache for an instant first paint
   3. one batched authoritative `getSeatAvailability(SEAT_IDS)` `eth_call` (implemented in plan 12;
      this plan defines the interface and consumes a stub that reports all available in dev)
   4. reconcile — **contract result always wins**
   5. react to Convex mint updates
   6. refresh after confirmed mints and on a sensible interval, not per second
   Expose `availability` as one reactive `Map<number, boolean>`, plus `status` and `refresh()`.
6. `BaggageSelector.vue` — appears after a seat is selected; copy `0.01 ETH per bag`;
   `[-] 0 [+]` control clamped to `0…65535`; keyboard accessible; updates the total instantly.
7. Selecting a seat updates booking state and `upsertSession`; `Continue to review` → `/review`.
8. Responsive: tablet moves the summary to a compact panel; mobile keeps the aircraft silhouette
   recognizable, allows contained horizontal scroll only if genuinely needed, never full-page
   overflow, and uses a sticky bottom total bar. Do not simply scale the aircraft down to
   illegibility.
9. Performance: one seat definition array, one availability map, keyed seat components, stable
   props, derived pricing memoized. No per-seat network calls, no per-seat Convex subscription.
10. Tests: occupied seat is disabled and unselectable; selected state toggles correctly; ARIA label
    strings exact; loading state renders no available seats; total recomputes for
    base + seat + bags.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm dev
```

Keyboard-only pass: tab into the map, arrow/tab between seats, select with Enter and Space, confirm
visible focus rings. Screen-reader spot check of three seats. Layout check at 1440/1024/768/375px.

## Done criteria

- The screen reads as an aircraft, not an NFT grid; the NFT concept is invisible here.
- 2-2 first class and 3-3 economy correct; exits at rows 10–11 marked.
- All 184 seats reachable and operable by keyboard.
- No flash of all-available seats on load.
- Bag count changes do not re-render aircraft geometry.

## Commit

`feat: aircraft seat map, seat states, and checked bag selection`
