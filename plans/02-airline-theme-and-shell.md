# Plan 02 — Airline theme tokens and app shell

## Goal

Establish the contemporary airline visual identity entirely through 1001 CSS variables, and build
the persistent shell: header, nav, footer, booking progress. Wallet UI must stay readable.

## Prerequisites

Plan 01 done, including `docs/1001-layer-notes.md`.

## Style direction (locked)

Contemporary, trendy airline. Not retro, not crypto.

- **Ink:** deep navy `#0B1B33`
- **Accent:** electric blue `#2563FF`
- **Surface:** warm off-white `#F7F6F3`, pure white cards
- **Semantic:** success `#0E7C5A`, error `#C2352B`
- **Type:** tight geometric sans (Inter variable, system fallback); wide-tracked small caps for
  labels like `PASSENGER`, `SEAT`, `FLIGHT`
- **Shape:** 10px default radius, 1px hairline borders, one restrained shadow level
- **Density:** spacious hero and booking cards, compact seat map and summary rails
- **Scheme:** locked light (`color-scheme: light`)

## Tasks

1. `app/assets/css/airline.css`, registered via `css: ['~/assets/css/airline.css']`. Structure:
   tokens first, then layout classes, then one-off classes. Never scoped styles for global tokens.
2. Define, at minimum: `color-scheme`, `--background`, `--background-semi`, `--color`,
   `--color-semi`, `--primary`, `--muted`, `--error`, `--success`, `--font-family`,
   `--ui-font-family`, `--ui-font-size`, `--ui-font-weight`, `--ui-letter-spacing`, `--ui-color`,
   `--ui-placeholder-color`, all `--button-*` families (default, primary, tertiary, icon colors,
   highlight states), `--input-background(-highlight)`, `--card-*`, `--dialog-width`,
   `--dialog-border-radius`, `--dialog-header-background`, `--dialog-close-color`,
   `--backdrop-background`, `--popover-*`, `--dropdown-*`, `--toast-*`, `--border-*`,
   `--border-radius*`, `--shadow`, `--spacer-*`.
   Button and input tokens are updated together — that is the known contrast failure mode.
3. Add airline-specific tokens layered on top: `--airline-ink`, `--airline-accent`,
   `--airline-surface`, `--airline-rail`, `--seat-available`, `--seat-selected`,
   `--seat-occupied`, `--seat-first`, `--seat-comfort`, `--seat-exit`. Seat colors are consumed by
   plan 11 only.
4. `app/layouts/default.vue` composing:
   - `AirlineHeader.vue` — left wordmark (original SVG, no third-party marks), center nav
     `BOOK / MY TRIPS / CHECK IN / FLIGHT STATUS`, right wallet surface. `CHECK IN` and
     `FLIGHT STATUS` render a tasteful disabled "Coming soon" tooltip using the layer's `Tooltip`.
   - `AirlineFooter.vue` — legal-ish small print including a one-line permanent-public-data notice.
   - Mobile nav: disclosure menu, wallet surface stays visible.
5. `AirlineHeader` wallet block uses `EvmConnectDialog class-name="wallet-button"` with a
   `#connected` slot of `EvmProfile class-name="wallet-button"` + `EvmAccount resolve-ens`.
   Style `.wallet-button` and force inherited color on inner `span/strong/small/.icon`. It should
   read as an airline account chip, never as a Web3 badge.
6. `BookingProgress.vue` — 6 steps (`Search, Flights, Traveler, Seats & Extras, Review, Boarding
   Pass`), current/complete/upcoming states, `aria-current="step"`, numeric fallback on mobile.
   Takes a single `step` prop; no internal route knowledge.
7. Create `public/icon.svg` and the wordmark asset. Original geometry only.

## Verification

```bash
pnpm typecheck
pnpm build
pnpm dev
```

Wallet contrast pass — inspect computed `color` / `background-color` on: disconnected connect
trigger, wallet selection dialog, connected profile trigger, profile dialog, network switcher,
disconnect action, every `Button` variant, and text inputs. Repeat at 375px width.

## Done criteria

- Every wallet surface above is legible; no inherited dark-on-dark or invisible icons.
- Header, footer, and progress render on desktop, tablet, and 375px mobile.
- No hardcoded hex values outside `airline.css`.
- `--dialog-width` narrows correctly under 480px.

## Commit

`feat: airline theme tokens, app shell, and booking progress`

## Plan log

- Executed 2026-08-13.
- Theme in `app/assets/css/airline.css` (1001 tokens + airline/seat tokens). Hex only in that file and SVG assets.
- Shell: `AirlineHeader`, `AirlineFooter`, `BookingProgress`, `app/layouts/default.vue`.
- `--dialog-width` is `27rem`, and `calc(100vw - var(--spacer) * 2)` under 480px.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0. Preview SSR `/` includes header, footer, progress, and wallet chip.
