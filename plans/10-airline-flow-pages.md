# Plan 10 — Airline flow: home, flights, traveler

## Goal

The first three steps of the booking funnel, at real commercial-airline quality.

## Prerequisites

Plans 02, 03, 09 done.

## Tasks

1. `app/pages/index.vue` — homepage:
   - hero with original abstract aviation visual (app-owned SVG/gradient composition, no stock or
     third-party imagery), headline `Where are you going?`
   - large booking card with real airline field styling: Trip Type `Round Trip`, From
     `Current Location`, To `Ethereum`, When `Now`, Travelers `1 Adult`. Fields look and focus like
     real controls but the domain is fixed — no calendar, no passenger stepper, no geolocation
     request.
   - primary CTA `Search Flights` → `/flights`
   - secondary content band: three restrained value props in airline voice
2. `app/pages/flights.vue`:
   - `BookingProgress step="flights"`
   - one `FlightResultCard`: `ETH001`, `Current Location NOW → Ethereum NOW`, `Nonstop`,
     `Round Trip`, fare `Main Cabin 0.001 ETH`, CTA `Select`
   - on select: `selectFlight()` in booking state, `upsertSession` to Convex, navigate `/traveler`
   - `TripSummary` rail: fare / seat `Not selected` / bags `0` / total
3. `app/pages/traveler.vue`:
   - `BookingProgress step="traveler"`
   - `TravelerForm.vue` built from the layer's `Form`, `FormItem`, `FormLabel` and inputs — no
     custom form primitives
   - fields: Full legal name (friendly character counter, byte-accurate validation), Date of birth
     (asked exactly **once**, ISO stored, `MAY 12` derived for display), X handle (accepts
     `user` or `@user`, normalizes on blur, shows canonical form)
   - inline validation mirroring contract constraints with plain-language messages; validation is
     UX only, never treated as security
   - subtle early privacy disclosure near the form: passenger details are written permanently to a
     public blockchain
   - Continue → `savePassengerDraft` + `upsertSession`, then `/seats`
4. `TripSummary.vue` — shared, sticky on desktop, collapsible bottom bar on mobile. All math via
   the bigint helpers and `formatEther`; never JS number arithmetic.
5. Navigation integrity: back/forward preserves all entered values; a refresh mid-funnel rehydrates
   from `localStorage` + Convex draft; no PII in the URL.
6. Loading and empty states for the Convex draft read; no blank frames, no bare spinners.
7. Tests: traveler form normalization and validation (`@user` → `user`, 49-byte name rejected,
   `1998-02-29` rejected), total computation across seat and bag combinations, progress component
   states.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm dev
```

Walk `/` → `/flights` → `/traveler` → back → forward at 1440px, 1024px, and 375px.

## Done criteria

- Homepage reads as a real airline, with no Web3 vocabulary anywhere in the copy.
- DOB is collected once; birthday is derived, never asked.
- Draft persists across refresh and back-navigation.
- Guest with no wallet can reach `/seats` unblocked.

## Commit

`feat: airline homepage, flight results, and traveler details`
