# Ethereum Airline — Nuxt EVM Dapp Cursor Build Prompt

> **Purpose:** Paste this file into Cursor as the primary implementation brief for the project.
>
> This is not a mockup brief. The agent is expected to implement the Nuxt application, wallet flow, Convex data layer, Foundry smart contracts, onchain SVG renderer, The Vessel integration, seat-selection experience, testing, and deployment documentation.
>
> **Architecture constraint:** This project is a **Nuxt/Vue EVM dapp built on the 1001 Digital Nuxt EVM stack**, not a Next.js/React/wagmi-first application.
>
> **Verified reference docs:**
>
> - 1001 agent routing guide: https://github.com/1001-digital/agent-guide/blob/main/llms.txt
> - 1001 Nuxt EVM layer guide: https://github.com/1001-digital/agent-guide/blob/main/blocks/layers.md
> - 1001 data guide: https://github.com/1001-digital/agent-guide/blob/main/blocks/data.md
> - 1001 contracts guide: https://github.com/1001-digital/agent-guide/blob/main/blocks/contracts.md
> - Convex Nuxt quickstart: https://docs.convex.dev/quickstart/nuxt
> - The Vessel overview: https://www.thevessel.fun/docs/overview
> - The Vessel contracts: https://www.thevessel.fun/docs/contracts
> - The Vessel parameters: https://www.thevessel.fun/docs/parameters
> - Official IVESSEL interface: https://github.com/producedbydav/The-Vessel/blob/main/Core%20Contracts/IVESSEL.sol
>
> Visual UX references:
>
> - https://www.delta.com/
> - https://www.jetblue.com/

---

# 0. NON-NEGOTIABLE AGENT INSTRUCTIONS

You are the senior Nuxt/Vue engineer, EVM engineer, Solidity engineer, database engineer, and product designer responsible for implementing this application end-to-end.

Do not stop at:

- planning
- scaffolding
- static UI
- fake wallet state
- mocked transactions
- placeholder Solidity
- database-only seat ownership
- a disconnected NFT renderer

Build the real vertical slice.

The product is complete only when a user can:

1. arrive at a polished airline-style Nuxt site,
2. select the Current Location → Ethereum flight,
3. fill out traveler information,
4. choose a real available seat from an aircraft seat map,
5. add any number of checked bags,
6. connect an Ethereum wallet,
7. submit one payable EVM transaction,
8. have that transaction atomically:
   - charge the exact fare,
   - reserve the selected seat forever,
   - mint the boarding-pass ERC-721,
   - write the passenger manifest payload into a delegated The Vessel Vault,
9. have the confirmed mint indexed into Convex,
10. land on a page rendering the fully onchain SVG boarding pass.

Do not introduce a React application, Next.js application, RainbowKit, React hooks, or React-specific Convex client.

Do not replace the existing Nuxt EVM foundation with a custom wallet stack.

---

# 1. READ THE REPOSITORY BEFORE WRITING CODE

Before changing files, inspect the repository.

Determine:

- Nuxt version
- Vue version
- package manager
- existing `nuxt.config.ts`
- existing `app.config.ts`
- existing `app/`, `pages/`, `components/`, `composables/`, `plugins/`, and `server/` conventions
- installed 1001 packages
- existing EVM layer configuration
- existing CSS/theme overrides
- existing wallet configuration
- existing ABI/artifact organization
- existing Convex setup
- existing Foundry setup
- existing Solidity source/test/script directories
- existing environment-variable conventions
- existing lint/typecheck/test scripts

Do not run a destructive framework reinitialization over an existing project.

Do not run `forge init` if Foundry is already initialized.

Do not create a second Nuxt app inside the repo.

Preserve working infrastructure unless there is a concrete reason to replace it.

---

# 2. READ THE INSTALLED CURSOR RULES AND ETH SKILLS FIRST

This repository already has Ethereum/EVM skills installed as Cursor rules.

Before implementing Solidity or wallet behavior:

1. inspect all applicable local agent/rule files,
2. identify the Ethereum, Solidity, security, Foundry, ABI, deployment, and frontend-EVM rules,
3. follow them throughout implementation.

Check locations such as:

```text
.cursor/rules/
.cursor/rules/**/*.mdc
.cursor/rules/**/*.md
.agents/
.agents/skills/
AGENTS.md
CLAUDE.md
```

Use the actual repository structure rather than assuming every path exists.

Treat the installed ETH skills as the project's local EVM engineering standard.

Do not delete, rewrite, weaken, or bypass those rules.

If a local ETH rule recommends a safer implementation than this brief while preserving the product requirements, use the safer implementation.

If an ETH rule appears to materially conflict with a product requirement, preserve the product requirement and implement the safest compatible interpretation. Document the decision in the README rather than silently ignoring either side.

Before Solidity implementation, create a short internal engineering checklist from the applicable rules covering at least:

- access control
- reentrancy
- external calls
- exact payment handling
- storage layout
- input validation
- ERC-721 behavior
- metadata safety
- deployment safety
- testing expectations
- fuzz/invariant testing
- The Vessel external-call assumptions

Do not ask the user to restate rules that already exist in the repo.

---

# 3. FOLLOW THE 1001 AGENT ROUTER

Read:

```text
https://github.com/1001-digital/agent-guide/blob/main/llms.txt
```

and the relevant block guides before implementing.

For this application, route the stack as follows.

## Required: Nuxt/Vue EVM foundation

Use:

```text
@1001-digital/layers.evm
```

This is the application foundation.

It provides the intended:

- Nuxt EVM application layer
- wallet connection UX
- connected account/profile UX
- network switching
- transaction-flow UX
- base forms
- buttons
- dialogs
- tooltips
- cards
- CSS tokens

Do not rebuild these primitives unless a product-specific component truly requires custom markup.

## Do not add `layers.base` separately

`layers.evm` already extends it.

## Do not install lower-level 1001 component/style packages just because they exist

Do not separately install:

```text
@1001-digital/components
@1001-digital/components.evm
@1001-digital/styles
```

solely to use the EVM layer.

## wagmi/viem rule

The 1001 layer can internally supply its own EVM stack, but if application source imports raw APIs from:

```text
@wagmi/core
viem
```

then declare those packages directly in the application dependencies.

For this project, direct contract simulation, ABI decoding, RPC reads, and Convex-side event synchronization are useful enough that direct `viem`, and likely `@wagmi/core`, are appropriate.

Do not install React wagmi.

---

# 4. 1001 BLOCK DECISIONS FOR THIS PRODUCT

Follow the 1001 routing model deliberately rather than installing every block.

## 4.1 `layers.evm`

**YES. Required.**

This is the app foundation.

## 4.2 `dapp-query`

**NO for initial implementation.**

The project already has:

- direct EVM reads,
- a Convex index/cache,
- a relatively small contract surface.

Do not add `dapp-query` simply because it exists.

Add it only later if the application demonstrably benefits from a unified:

```text
Convex index → RPC fallback → local cache → live refresh
```

read strategy.

If direct contract reads plus Convex remain simple, keep them simple.

## 4.3 1001 event indexer

**Do not introduce `simple-indexer` as a second application database.**

Convex is intentionally the application-owned index/database for this product.

Use Convex to maintain event-derived booking and seat data.

## 4.4 metadata stack

The boarding pass is intentionally rendered as an onchain `data:` URI.

Therefore do not add IPFS/IPNS/Arweave metadata normalization unless another project requirement appears later.

## 4.5 NFT contract extensions

Use OpenZeppelin 5 and the installed ETH rules as the default contract foundation.

Inspect 1001's ERC-721 extension library before using an extension, but do not compose extensions just to use them.

This contract has unusual deterministic token IDs and an external Vessel write, so a small custom ERC-721 contract is preferable to unnecessary extension composition.

---

# 5. NUXT EVM APPLICATION FOUNDATION

The repository should ultimately use the 1001 EVM layer in `nuxt.config.ts`.

Conceptually:

```ts
export default defineNuxtConfig({
  extends: ['@1001-digital/layers.evm'],
})
```

Do not also extend `@1001-digital/layers.base`.

Preserve other existing Nuxt modules.

Use the current 1001 source and installed package version to verify exact configuration names before committing configuration.

Do not invent package exports or component props when the source can be inspected.

The 1001 agent guide explicitly says the guide is a routing document rather than an exhaustive API reference. When an exact component prop or composable matters, inspect the installed package or source.

---

# 6. NUXT EVM CHAIN CONFIGURATION

Production chain:

```text
Ethereum Mainnet
Chain ID: 1
```

Development chain:

```text
Anvil
Chain ID: 31337
```

Optional read-only integration testing:

```text
Ethereum mainnet fork through Anvil/Foundry
```

Do not make Sepolia a product requirement unless an actual compatible Vessel test deployment is available.

Use `app.config.ts` for non-secret application behavior.

Use Nuxt runtime config/environment variables for RPC endpoints and endpoint-like settings.

A conceptual configuration:

```ts
export default defineAppConfig({
  evm: {
    title: 'Ethereum Airways',
    defaultChain: 'mainnet',
    chains: {
      mainnet: {
        id: 1,
        blockExplorer: 'https://etherscan.io',
      },
    },
    inAppWallet: {
      enabled: false,
    },
  },
})
```

Do not assume the final property names without checking the currently installed 1001 layer.

---

# 7. NUXT EVM ENVIRONMENT VARIABLES

Centralize all deployment-specific configuration.

At minimum support values equivalent to:

```text
NUXT_PUBLIC_EVM_WALLET_CONNECT_PROJECT_ID=
NUXT_PUBLIC_EVM_CHAINS_MAINNET_RPCS=

NUXT_PUBLIC_BOARDING_PASS_ADDRESS=
NUXT_PUBLIC_VESSEL_ADDRESS=
NUXT_PUBLIC_VESSEL_CRAFT_ID=
NUXT_PUBLIC_CHAIN_ID=1

CONVEX_URL=
CONVEX_DEPLOYMENT=

ETHEREUM_RPC_URL=
```

The exact Convex-generated environment names should follow the installed Convex version.

Do not commit secrets.

Do not hardcode private RPC URLs in source.

The Vessel production contract address is currently:

```text
0xECb92Cc7112b80A2234936315BbB493fb48d1463
```

Treat it as deployment configuration even if production currently uses that address.

---

# 8. CONVEX + NUXT

Use the official/current Nuxt integration path documented by Convex.

The baseline dependencies are:

```text
convex
convex-nuxt
```

The Nuxt module should be registered in `nuxt.config.ts` according to the installed version.

The current documented shape is conceptually:

```ts
export default defineNuxtConfig({
  modules: ['convex-nuxt'],
  convex: {
    url: process.env.CONVEX_URL,
  },
})
```

Use `useConvexQuery` or the current equivalent from `convex-nuxt` for reactive reads.

Inspect the installed package/docs for the current mutation/action composables instead of inventing names.

Convex is used for:

- guest booking drafts
- completed-booking index
- seat availability cache
- fast UI queries
- wallet booking history
- transaction reconciliation
- application analytics
- sync state

Convex is **not** the source of truth for seat ownership.

Ethereum is authoritative.

---

# 9. DO NOT ADD SIWE UNLESS IT BECOMES NECESSARY

The user should be able to use the app as a guest until checkout.

The user can connect a wallet at any time.

For this version:

- wallet connection is identity for UI purposes,
- the final blockchain transaction proves control of the purchasing wallet,
- no separate SIWE signature is necessary.

Therefore do not force:

```text
Connect wallet
→ Sign SIWE message
→ Sign purchase transaction
```

That creates unnecessary friction.

Use:

```text
guest browsing
→ connect wallet when needed
→ one booking transaction
```

If future backend authorization genuinely requires SIWE, use the 1001 SIWE primitives at that time.

---

# 10. 1001 WALLET COMPONENTS

Use the EVM layer's wallet components before building custom ones.

Default header wallet behavior should use the appropriate current versions of:

```text
EvmConnectDialog
EvmProfile
EvmAccount
EvmSwitchNetwork
```

Disconnected:

```text
Sign In
```

or:

```text
Connect Wallet
```

Connected:

```text
0x12A4…9F82
```

Optionally resolve ENS through `EvmAccount` if the existing project has that configured.

Do not visually dominate the airline header with Web3 UI.

The connected state should feel like an airline account menu.

---

# 11. 1001 TRANSACTION FLOW

Use the current `EvmTransactionFlow` / `EvmTransactionFlowDialog` APIs for the final checkout experience.

The app should present exactly one wallet transaction.

The request function should:

1. verify a wallet is connected,
2. verify the correct chain,
3. read the authoritative `quote(seatId, bagCount)` from the contract,
4. simulate the booking transaction,
5. submit `bookAndMint(...)` with the exact quoted `value`,
6. allow the 1001 transaction flow to present:
   - confirmation,
   - submitted,
   - pending,
   - receipt,
   - success/failure.

Inspect the installed 1001 component source to determine the exact callback/event API for receipt handling.

Do not invent undocumented props.

A conceptual transaction function may use direct `@wagmi/core`:

```ts
import {
  readContract,
  simulateContract,
  writeContract,
} from '@wagmi/core'
```

If direct imports are used, declare `@wagmi/core` as a direct dependency.

Use `viem` for ABI types, formatting/parsing, log decoding, and server/indexer work where appropriate.

---

# 12. PRODUCT CONCEPT

Create an airline website whose functionality is simple but whose presentation takes the airline metaphor seriously.

The route is:

```text
Current Location
→
Ethereum
```

Trip type:

```text
Round Trip
```

When:

```text
Now
```

Travelers:

```text
1 Adult
```

Base fare:

```text
0.001 ETH
```

There is only one flight.

There is only one traveler per booking.

There is one selected seat and one boarding-pass NFT per booking.

The humor should come from the seriousness of the execution.

It should feel like a real commercial airline booking flow rather than a crypto parody.

---

# 13. VISUAL REFERENCE

Study the information architecture and interaction patterns of:

- Delta
- JetBlue

Pay attention to:

- header hierarchy
- booking search card
- route selection fields
- fare result cards
- breadcrumb/progress patterns
- traveler forms
- sticky trip summaries
- seat maps
- extras
- checkout
- boarding pass presentation

Do not copy:

- logos
- trademarks
- exact brand assets
- proprietary photography
- exact copy
- exact visual identity

Create an original airline identity with comparable polish.

---

# 14. DESIGN LANGUAGE

Baseline:

- deep navy
- white
- cool/light neutral surfaces
- strong blue accent
- occasional semantic green/red
- modern sans-serif typography
- restrained shadow
- subtle borders
- comfortable spacing
- 8–12px common radii
- clear focus states
- professional airline icons

Avoid:

- neon crypto gradients
- terminal aesthetics
- NFT marketplace cards
- glassmorphism everywhere
- chain explorer-style tables
- giant hexadecimal wallet addresses
- Web3 jargon

A user should think:

> "This looks like I'm actually buying a plane ticket to Ethereum."

---

# 15. USE THE 1001 THEME SYSTEM

The 1001 EVM layer loads its shared CSS variable system.

Theme the application through global CSS tokens first.

Create one application-level theme file, for example:

```text
app/assets/css/airline.css
```

or the path appropriate to the existing Nuxt version.

Use variables before selector hacks.

At minimum establish coordinated values for:

```text
--background
--background-semi
--color
--color-semi
--primary
--muted
--error
--success

--ui-font-family
--ui-font-size
--ui-color
--ui-placeholder-color

--button-background
--button-background-highlight
--button-color
--button-primary-background
--button-primary-color

--input-background
--input-background-highlight

--card-background
--card-border
--card-border-radius

--dialog-width
--dialog-border-radius
--backdrop-background

--border-color
--border-radius
--shadow
```

Pin the intended `color-scheme`.

Test wallet dialogs after theme changes.

Do not create a beautiful airline shell and then leave the wallet dialog unreadable because inherited 1001 tokens conflict.

Test both:

- disconnected connect trigger
- connected profile trigger

after all theme changes.

---

# 16. ROUTES

Use Nuxt file-based routing.

Depending on the existing Nuxt version/layout, use the appropriate `app/pages` or `pages` convention.

Create routes equivalent to:

```text
/
 /flights
 /traveler
 /seats
 /review
 /boarding-pass/[tokenId]
```

Optional:

```text
/my-trips
```

only if it remains small.

Do not build unrelated airline functionality.

Header links such as Check In or Flight Status may show a tasteful inactive/coming-soon state.

---

# 17. BOOKING STATE COMPOSABLE

Do not add Pinia unless the repo already uses it or it clearly solves an existing architectural need.

Prefer a Nuxt-native composable.

Create something equivalent to:

```text
composables/useBooking.ts
```

Back it with Nuxt `useState`.

Booking state should contain:

```ts
interface BookingState {
  sessionId: string

  flightNumber: 'ETH001'
  origin: 'Current Location'
  destination: 'Ethereum'
  tripType: 'Round Trip'
  departure: 'Now'

  baseFareWei: bigint

  fullName: string
  dateOfBirthISO: string
  dateOfBirthUint32?: number
  twitterHandle: string

  selectedSeatId?: number
  selectedSeatLabel?: string
  selectedSeatPriceWei?: bigint

  bagCount: number

  authoritativeQuoteWei?: bigint

  walletAddress?: `0x${string}`

  txHash?: `0x${string}`
  tokenId?: number
  vesselCraftId?: number
  vesselEntry?: number
}
```

Do not serialize `bigint` directly to JSON/localStorage.

Use decimal strings for persistence boundaries.

The in-memory state may use bigint.

Persist a session identifier locally.

Persist enough booking data to survive page navigation and accidental refresh.

Do not put traveler PII in URL query parameters.

---

# 18. APPLICATION CONSTANTS

Create centralized product configuration.

Example:

```ts
export const FLIGHT = {
  flightNumber: 'ETH001',
  origin: 'Current Location',
  destination: 'Ethereum',
  tripType: 'Round Trip',
  departure: 'Now',
  travelers: 1,
  baseFareWei: 1_000_000_000_000_000n,
} as const

export const BAG_PRICE_WEI = 10_000_000_000_000_000n
```

Use `formatEther` for display.

Do not use floating-point JavaScript arithmetic for ETH amounts.

All canonical price math should use wei/bigint.

---

# 19. PRIMARY FLOW

The booking progression is:

```text
1. Search
2. Flights
3. Traveler
4. Seats & Extras
5. Review & Pay
6. Boarding Pass
```

Create a reusable progress component.

Preserve booking state when navigating backward.

The user may remain disconnected through steps 1–5.

Wallet connection is mandatory only to purchase.

---

# 20. HOMEPAGE

Create a premium airline homepage.

Header:

Left:

- original airline wordmark/logo

Center:

- BOOK
- MY TRIPS
- CHECK IN
- FLIGHT STATUS

Right:

- 1001 wallet connect/profile surface

Hero:

- strong original airline imagery or tasteful abstract aviation visual
- large booking card

Booking card fields:

```text
Trip Type
Round Trip

From
Current Location

To
Ethereum

When
Now

Travelers
1 Adult
```

Primary CTA:

```text
Search Flights
```

The fields can be visually interactive even though the values are fixed.

Do not request browser geolocation.

"Current Location" is conceptual copy.

---

# 21. FLIGHT RESULTS

Route:

```text
/flights
```

Show one believable result.

Example:

```text
ETH001

Current Location
NOW

→

Ethereum
NOW

Nonstop
Round Trip
```

Fare:

```text
Main Cabin
0.001 ETH
```

CTA:

```text
Select
```

When selected:

- set base fare in booking state,
- save/update the Convex booking draft,
- navigate to `/traveler`.

Trip summary:

```text
Round-trip fare       0.001 ETH
Seat                  Not selected
Bags                  0
---------------------------------
Total                 0.001 ETH
```

---

# 22. TRAVELER DETAILS

Route:

```text
/traveler
```

Use the 1001 layer's existing Form/FormItem/FormLabel/input patterns before creating generic replacements.

Collect:

## Full legal name

Field:

```text
fullName
```

Required.

Contract maximum:

```text
48 UTF-8 bytes
```

The frontend should display a user-friendly character limit while the contract validates byte length.

## Date of birth

Field:

```text
dateOfBirth
```

Ask once.

Store client-side canonical ISO:

```text
YYYY-MM-DD
```

Convert to onchain:

```text
YYYYMMDD
```

as `uint32`.

Example:

```text
1998-05-12
→
19980512
```

## X / Twitter handle

Field:

```text
twitterHandle
```

Allow the UI to accept either:

```text
username
@username
```

Normalize before contract submission to:

```text
username
```

without `@`.

The renderer can add `@` for display.

---

# 23. DO NOT ASK FOR BIRTHDAY TWICE

The original concept mentions both birthday and date of birth.

Do not present duplicate inputs.

Ask for one Date of Birth.

Derive:

```text
Date of Birth: 1998-05-12
Birthday: MAY 12
```

The renderer derives birthday from the DOB.

---

# 24. TRAVELER VALIDATION

Frontend validation should match contract constraints.

At minimum:

```text
fullName:
1–48 UTF-8 bytes

twitterHandle:
0–32 bytes after normalization

dateOfBirth:
valid YYYY-MM-DD
valid actual calendar day
```

The contract must independently validate the canonical data.

Do not treat frontend validation as security.

---

# 25. PRIVACY

This is a deliberate public-onchain-data project.

Traveler information includes:

- name
- date of birth
- X handle

Those values can become permanently public.

Do not obscure this.

On Traveler Details, include subtle early disclosure.

Immediately before purchase, require explicit consent.

Suggested checkout copy:

```text
I understand that my passenger information, including my
name and date of birth, will be permanently stored on a
public blockchain and may not be removable.
```

Checkout cannot proceed until the checkbox is selected.

---

# 26. CONVEX DRAFTS

When the traveler continues, upsert a draft by `sessionId`.

Draft data may include:

```text
sessionId
fullName
dateOfBirthISO
twitterHandle
selectedSeatId
bagCount
status
updatedAt
```

Do not use the wallet as the only draft key because guest users are intentionally supported.

The browser-generated session ID is the draft identity.

Completed bookings are later keyed/indexed by blockchain identifiers.

---

# 27. SEATS & EXTRAS — MOST IMPORTANT PAGE

Route:

```text
/seats
```

Spend disproportionate effort on this screen.

The page must look and behave like a commercial airline seat-selection page.

Do not build a generic NFT grid.

The user is choosing an airplane seat.

The fact that each seat is an NFT should be invisible until the booking context explains it.

---

# 28. AIRCRAFT VISUAL

Create a top-down narrow-body aircraft silhouette.

Vertical orientation:

```text
NOSE
↓
FIRST CLASS
↓
COMFORT
↓
WINGS / EMERGENCY EXITS
↓
MAIN CABIN
↓
REAR CABIN
↓
TAIL
```

The aircraft should have:

- rounded nose
- fuselage
- wings
- tail
- cabin divider cues
- aisle
- front galley cue
- rear galley cue
- subtle lavatory icons
- visible EXIT markers at emergency rows

Do not download or copy an airline's proprietary seat-map asset.

Build the aircraft as an app-owned SVG/CSS composition.

---

# 29. SEAT MAP IMPLEMENTATION STRATEGY

Prefer:

- inline SVG for aircraft silhouette/background geometry,
- semantic HTML `<button>` elements for seats,
- CSS Grid for seat rows,
- DOM tooltips for hover/focus,
- accessible labels.

Do not make every seat an inaccessible SVG `<rect>` with pointer handlers only.

The aircraft SVG can sit behind/around the DOM seat matrix.

Static geometry should not rerender every time bag count changes.

Memoize or keep static seat definitions outside component setup where appropriate.

---

# 30. SEAT LAYOUT

Use 32 rows.

## Rows 1–4 — First Class

Configuration:

```text
A C   D F
```

2 / aisle / 2.

No B or E.

16 seats total.

## Rows 5–9 — Comfort

Configuration:

```text
A B C   D E F
```

3 / aisle / 3.

## Rows 10–11 — Emergency Exit

Configuration:

```text
A B C   D E F
```

Display prominent but restrained EXIT markers at the wings.

## Rows 12–24 — Main Cabin

Configuration:

```text
A B C   D E F
```

## Rows 25–32 — Rear Cabin

Configuration:

```text
A B C   D E F
```

Total physical seats:

```text
184
```

---

# 31. DETERMINISTIC SEAT ID / NFT TOKEN ID

Every physical seat is one unique ERC-721.

Use:

```text
seatId = row * 10 + columnCode
```

Column codes:

```text
A = 1
B = 2
C = 3
D = 4
E = 5
F = 6
```

Examples:

```text
1A  = 11
1C  = 13
4F  = 46
12A = 121
18D = 184
32F = 326
```

Use:

```text
tokenId = seatId
```

Therefore:

```text
Seat 12A == Boarding Pass token #121
```

Invalid seat IDs must revert.

Example:

```text
1B
```

does not exist.

---

# 32. SEAT DOMAIN MODEL

In both Solidity and TypeScript, separate:

```text
cabin
position
special row
```

rather than encoding every possible combination into a giant enum.

Recommended Solidity enums:

```solidity
enum Cabin {
    First,
    Comfort,
    Exit,
    Main,
    Rear
}

enum SeatPosition {
    Window,
    Middle,
    Aisle
}
```

First Class seats can still be Window/Aisle.

Human-facing priority label:

```text
First Class
Comfort
Emergency Exit Row
Window
Aisle
Middle
Rear Window
Rear Aisle
Rear Middle
```

The boarding pass should emphasize the special cabin label first.

---

# 33. SEAT POSITION

Columns:

```text
A = Window
B = Middle
C = Aisle
D = Aisle
E = Middle
F = Window
```

For First Class:

```text
A = Window
C = Aisle
D = Aisle
F = Window
```

---

# 34. AUTHORITATIVE SEAT PRICING

The contract owns pricing.

The frontend never submits a seat price.

Base fare:

```text
0.001 ETH
```

Bag price:

```text
0.01 ETH each
```

Seat price is additional.

Implement deterministic pricing in Solidity.

Use the following exact baseline formula unless a local ETH skill reveals a technical issue.

## First Class — rows 1–4

```text
row 1 = 0.060 ETH
row 2 = 0.055 ETH
row 3 = 0.050 ETH
row 4 = 0.045 ETH
```

Formula:

```text
0.060 ETH - ((row - 1) × 0.005 ETH)
```

All First Class seats in the same row share the same price.

## Comfort — rows 5–9

```text
row 5 = 0.030 ETH
row 6 = 0.028 ETH
row 7 = 0.026 ETH
row 8 = 0.024 ETH
row 9 = 0.022 ETH
```

Formula:

```text
0.030 ETH - ((row - 5) × 0.002 ETH)
```

## Emergency Exit — rows 10–11

```text
row 10 = 0.018 ETH
row 11 = 0.016 ETH
```

All seats in the emergency row share the row price.

## Main Cabin — rows 12–24

Window/Aisle:

```text
0.009 ETH - ((row - 12) × 0.0005 ETH)
```

Therefore:

```text
row 12 = 0.009 ETH
row 24 = 0.003 ETH
```

Middle:

```text
windowOrAislePrice × 2 / 3
```

Therefore:

```text
row 12 middle = 0.006 ETH
row 24 middle = 0.002 ETH
```

## Rear Cabin — rows 25–32

Window/Aisle:

```text
0.001 ETH - ((row - 25) × 0.00012 ETH)
```

Therefore approximately:

```text
row 25 = 0.001 ETH
row 32 = 0.00016 ETH
```

Middle:

```text
windowOrAislePrice / 2
```

Therefore:

```text
row 32 middle = 0.00008 ETH
```

Required hierarchy:

```text
First
>
Comfort
>
Emergency Exit
>
Main Window/Aisle
>
Main Middle
>
Rear
```

Do all math in wei.

Do not use floating point.

---

# 35. SOLIDITY PRICE FUNCTIONS

Expose:

```solidity
function seatPrice(uint16 seatId)
    public
    pure
    returns (uint256);
```

Expose:

```solidity
function quote(
    uint16 seatId,
    uint16 bagCount
)
    public
    pure
    returns (uint256);
```

Canonical:

```text
quote =
0.001 ETH
+ seatPrice(seatId)
+ (0.01 ETH × bagCount)
```

Final purchase requires:

```solidity
if (msg.value != quote(seatId, bagCount)) {
    revert IncorrectPayment(...);
}
```

Reject both underpayment and overpayment.

---

# 36. TYPESCRIPT PRICE MIRROR

For instant seat-map hover UX, implement a TypeScript mirror of the deterministic seat-pricing formula.

Example:

```text
app/lib/booking/seatPricing.ts
```

This mirror is display optimization only.

The contract is authoritative.

Add a test that compares every valid seat's TypeScript price against the Solidity contract on local Anvil.

Test all 184 seats.

If they ever diverge, tests must fail.

At final checkout:

- read `quote` from the contract,
- use the returned wei value as `msg.value`.

Do not trust the TypeScript mirror for payment.

---

# 37. SEAT STATES

Each seat must support:

## Available

Clickable.

## Hover/focus

Tooltip:

```text
12A
Window
0.009 ETH
```

## Selected

Strong selected state and check indicator.

## Occupied

Disabled.

Muted.

Display:

```text
Unavailable
```

Do not rely on color alone.

## Loading

Do not initially flash all seats as available before blockchain/index state is loaded.

Show a deliberate skeleton/loading treatment.

---

# 38. SEAT AVAILABILITY CONTRACT READ

Ethereum owns availability.

Add a batch view function to avoid 184 separate RPC round trips.

Recommended:

```solidity
function getSeatAvailability(
    uint16[] calldata seatIds
)
    external
    view
    returns (bool[] memory);
```

Each result should report whether the seat exists and has not been minted.

The frontend may pass all 184 valid seat IDs in one `eth_call`.

Convex may provide an immediate cached state while the contract read refreshes.

When they conflict:

```text
contract result wins
```

At purchase time, the contract independently rejects an already minted token.

---

# 39. SEAT MAP RESPONSIVENESS

Desktop:

```text
Aircraft/map: about 70%
Trip summary: about 30%
```

Summary should be sticky.

Tablet:

- seat map
- summary below or compact side panel

Mobile:

- preserve aircraft silhouette
- allow contained horizontal scroll only if genuinely required
- no full-page horizontal overflow
- sticky bottom total bar
- tap opens/updates seat information
- minimum usable seat hit target around 40px

Do not simply scale the entire aircraft to unreadable size.

---

# 40. STICKY TRIP SUMMARY

Example:

```text
YOUR TRIP

Current Location
→
Ethereum

Round-trip fare        0.001 ETH
Seat 12A               0.009 ETH
1 Checked Bag          0.010 ETH

--------------------------------
TOTAL                   0.020 ETH
```

Use `formatEther`.

Never use JS number arithmetic for totals.

---

# 41. BAGS

After a seat is selected, show Checked Bags.

Copy:

```text
0.01 ETH per bag
```

Control:

```text
[-]  0  [+]
```

The user asked for unlimited conceptual selection.

Onchain type:

```text
uint16
```

This gives an effectively unlimited UX for a normal traveler without dangerous unbounded integers.

Do not cap at 2.

Frontend should prevent negative values and values above `uint16.max`.

---

# 42. REVIEW PAGE

Route:

```text
/review
```

Sections:

## Flight

```text
Current Location → Ethereum
Round Trip
Now
ETH001
```

## Traveler

```text
Full name
Date of birth
@handle
```

## Seat

```text
12A
Window
```

or:

```text
10C
Emergency Exit Row
```

## Extras

```text
1 Checked Bag
```

## Payment

```text
Round-trip fare
Seat
Bags
Total
```

On page entry, read the authoritative contract quote.

If the seat was claimed:

- preserve traveler/bag data,
- show a clear message,
- route back to seat selection.

---

# 43. WALLET GATE

If disconnected:

```text
Connect Wallet to Book
```

Use `EvmConnectDialog`.

After successful connection:

- preserve the booking state,
- stay on review,
- immediately show the purchase CTA.

If connected to the wrong network:

use the 1001 network-switch UI rather than a custom raw MetaMask prompt.

---

# 44. FINAL PURCHASE CTA

Connected + correct network + valid seat + privacy consent:

```text
Purchase Boarding Pass · 0.020 ETH
```

Use the authoritative quote.

Do not show success until a receipt confirms.

---

# 45. TRANSACTION UX LANGUAGE

Use airline language.

Good:

```text
Confirm your booking in your wallet
Booking your flight…
You're cleared for Ethereum.
```

Avoid:

```text
Execute contract call
EOA connected
Transaction finality pending
Mint function invoked
```

Blockchain implementation should disappear beneath the product metaphor.

---

# 46. SMART CONTRACT TOOLING — FOUNDRY IS ALREADY INSTALLED

Foundry is the Solidity development and test environment.

Before changing it:

- inspect `foundry.toml`,
- inspect `lib/`,
- inspect remappings,
- inspect existing profiles,
- inspect source/test/script directories.

Do not run `forge init` if already initialized.

Use the existing layout if one exists.

Otherwise a clean structure is:

```text
contracts/
  foundry.toml
  src/
    BoardingPass.sol
    BoardingPassRenderer.sol

    interfaces/
      IVESSEL.sol
      IBoardingPass.sol
      IBoardingPassRenderer.sol

    libraries/
      SeatLib.sol
      DateLib.sol
      SvgEscape.sol
      JsonEscape.sol

    mocks/
      MockVessel.sol

  test/
    BoardingPass.t.sol
    BoardingPassPricing.t.sol
    BoardingPassRenderer.t.sol
    VesselIntegration.t.sol
    Invariants.t.sol

  script/
    DeployLocal.s.sol
    DeployMainnet.s.sol
```

If Foundry already lives at repo root, do not create a nested Foundry project just to match this example.

---

# 47. FOUNDRY COMMANDS

The finished repository should pass the appropriate equivalents of:

```bash
forge fmt --check
forge build
forge test
```

Use verbosity when debugging:

```bash
forge test -vvv
```

Use Anvil for local app integration.

Use `cast` for deployment verification/read checks when useful.

Do not leave ignored failing tests.

---

# 48. OPENZEPPELIN

Use OpenZeppelin Contracts 5.

Use only the modules actually needed.

Likely:

```text
ERC721
Ownable2Step
Pausable
ReentrancyGuard
Strings
Base64
```

Confirm import paths against the installed OpenZeppelin version and local ETH rules.

Do not blindly copy outdated OpenZeppelin 4 patterns.

Do not add an upgradeability stack unless explicitly required.

This contract should be non-upgradeable by default.

---

# 49. CONTRACTS

Create two primary contracts:

```text
BoardingPass.sol
BoardingPassRenderer.sol
```

Plus interfaces/libraries.

BoardingPass:

- owns canonical booking state,
- owns seat availability,
- owns payment logic,
- mints ERC-721,
- writes to Vessel.

Renderer:

- reads BoardingPass state,
- creates SVG,
- creates tokenURI.

---

# 50. BOARDING PASS CONTRACT

Conceptual inheritance:

```solidity
contract BoardingPass is
    ERC721,
    Ownable2Step,
    Pausable,
    ReentrancyGuard
```

Adapt constructor requirements to OpenZeppelin 5.

Collection:

```text
Name: Ethereum Boarding Pass
Symbol: ETHAIR
```

Constants:

```solidity
uint256 public constant BASE_FARE = 0.001 ether;
uint256 public constant BAG_PRICE = 0.01 ether;
```

Flight constants:

```text
Origin: Current Location
Destination: Ethereum
Trip: Round Trip
Departure: Now
Flight: ETH001
```

---

# 51. TOKEN OWNERSHIP

Use:

```text
tokenId = seatId
```

No sequential mint counter.

No random assignment.

No metadata reveal.

The seat itself is the token identity.

`_ownerOf(tokenId) == address(0)` can determine unminted status internally.

---

# 52. TRANSFERABILITY

Default behavior:

- boarding passes are transferable ERC-721s.

However:

- the original passenger/traveler record remains immutable,
- transferring the NFT does not rewrite the person's name or DOB.

Store both concepts distinctly:

```text
original traveler
current NFT owner
```

The renderer displays the original traveler data.

The current ERC-721 owner remains queryable through standard ownership.

Do not silently rewrite passenger PII during transfer.

---

# 53. BOARDING PASS DATA STRUCT

Use a gas-conscious but readable canonical structure.

Example:

```solidity
struct BoardingPassData {
    address traveler;
    uint32 dateOfBirth;
    uint16 seatId;
    uint16 bagCount;
    uint64 mintedAt;
    uint96 totalPaid;
    uint16 vesselCraftId;
    uint32 vesselEntry;
    string fullName;
    string twitterHandle;
}
```

Check actual max values before choosing final widths.

The Vessel craft ID range is currently at most 10,000, but do not create unsafe casts.

Use explicit checked casts or widths that comfortably cover the values.

If local ETH rules recommend a simpler all-`uint256` structure for safety/readability, prefer that over premature packing.

Correctness > micro-optimization.

---

# 54. DATE OF BIRTH

Onchain representation:

```text
YYYYMMDD
```

stored as:

```solidity
uint32
```

Example:

```text
19980512
```

Implement a library/view helper to extract:

```text
year
month
day
```

Validate:

- month 1–12,
- actual days per month,
- February,
- leap years.

Renderer outputs:

```text
1998-05-12
MAY 12
```

Do not ask for birthday separately.

---

# 55. TWITTER/X HANDLE

Frontend normalizes:

```text
@username
→
username
```

Contract canonical rule:

- empty is allowed if product decides handle is optional,
- otherwise bytes length <= 32,
- canonical stored form must not start with `@`.

If user enters `@`, remove it before simulation/submission.

Renderer displays:

```text
@username
```

Do not render `@@username`.

---

# 56. STRING VALIDATION

Validate byte length in Solidity.

At minimum:

```text
fullName: 1–48 bytes
twitterHandle: 0–32 bytes
```

Consider rejecting control characters.

Do not attempt overly complicated Unicode normalization onchain.

The NFT renderer must safely escape all user text.

---

# 57. MAIN BOOKING FUNCTION

Expose one primary payable state-changing function:

```solidity
function bookAndMint(
    uint16 seatId,
    string calldata fullName,
    uint32 dateOfBirth,
    string calldata twitterHandle,
    uint16 bagCount
)
    external
    payable
    nonReentrant
    whenNotPaused;
```

This is the only end-user transaction required.

Responsibilities:

1. validate the seat,
2. reject already minted seat,
3. validate name,
4. validate DOB,
5. validate normalized X handle,
6. compute exact fare internally,
7. require exact `msg.value`,
8. verify Vessel integration readiness,
9. compute expected next Vessel entry,
10. encode the manifest payload,
11. ensure payload fits the Vessel Craft capacity,
12. append the payload to the delegated Vault,
13. verify entry increment if appropriate,
14. store canonical boarding-pass data,
15. mint ERC-721 token to `msg.sender`,
16. emit indexer-friendly event.

Everything is atomic.

---

# 58. ATOMICITY

This is critical.

There must never be a successful state where:

```text
Boarding Pass minted
but
Vessel write failed
```

or:

```text
Vessel manifest written
but
Boarding Pass transaction failed
```

Because both actions occur in the same EVM transaction, any revert should roll the entire transaction back.

Do not catch and ignore the Vessel failure.

Do not use a low-level call that suppresses failure.

If `setPayloadHolder` reverts, `bookAndMint` reverts.

---

# 59. THE VESSEL PRODUCTION CONTRACT

Ethereum mainnet Vessel ERC-721:

```text
0xECb92Cc7112b80A2234936315BbB493fb48d1463
```

Use the official interface from:

```text
Core Contracts/IVESSEL.sol
```

Do not hand-invent incompatible function signatures.

The current official interface uses Solidity `^0.8.20`.

Copy only the interface surface actually needed, or vendor the current compatible interface according to repo conventions.

---

# 60. THE VESSEL ARCHITECTURE

Use **one Vessel Vault Craft as the flight manifest**.

Do not claim a new Vessel Craft for every traveler.

Conceptually:

```text
Vessel Vault Craft #X
├── Entry 1  → passenger booking 1
├── Entry 2  → passenger booking 2
├── Entry 3  → passenger booking 3
├── Entry 4  → passenger booking 4
└── ...
```

The user's collectible is the separate BoardingPass ERC-721.

The Vessel Vault is the permanent manifest.

---

# 61. WHY A VAULT

The current Vessel implementation distinguishes Capsules and Vaults.

For a Vault, calling:

```solidity
setPayloadHolder(craftId, payload)
```

appends the payload to the Vault's payload list and increments:

```solidity
craftToEntry(craftId)
```

For a Capsule, later writes replace its one payload.

Therefore this application requires an actual Vessel **Vault** Craft.

Do not use a Capsule as the flight manifest.

---

# 62. VESSEL BYTE CAPACITY

The Vessel enforces:

```text
payload byte length <= Craft token ID
```

So:

```text
Craft #8000
≈ 8000-byte maximum payload per entry
```

This is per payload write, not a total lifetime sum across Vault entries.

Use a reasonably high-ID Vault.

Before writing, BoardingPass should defensively require the encoded payload to fit.

Conceptually:

```solidity
if (payload.length > vesselCraftId) {
    revert VesselPayloadTooLarge(...);
}
```

---

# 63. VESSEL DELEGATION

The current Vessel allows the token holder to set a delegate.

Before the booking contract goes live:

```solidity
vessel.setDelegate(
    vesselCraftId,
    address(boardingPass)
);
```

The Vessel owner performs this transaction.

Then `BoardingPass` can call:

```solidity
setPayloadHolder(...)
```

as the delegated writer.

This delegation transaction is an operator deployment/setup action.

It is **not** part of each customer's booking flow.

---

# 64. VESSEL RUNTIME READINESS CHECK

Before every booking, validate at minimum:

```text
craftToVaultStatus(vesselCraftId) == true
craftToLocked(vesselCraftId) == false
craftToDelegate(vesselCraftId) == address(this)
```

If any fails, revert with a specific custom error.

Examples:

```solidity
error VesselCraftNotVault();
error VesselCraftLocked();
error VesselDelegateMismatch();
error VesselPayloadTooLarge(uint256 length, uint256 capacity);
```

The frontend should translate these into a temporary checkout-unavailable state rather than blaming the user.

---

# 65. VESSEL ENTRY NUMBERING

Use `craftToEntry(vesselCraftId)` as the entry counter.

Recommended flow:

```text
beforeEntry = craftToEntry(craftId)
expectedEntry = beforeEntry + 1
```

Encode `expectedEntry` into the manifest payload.

Call:

```solidity
setPayloadHolder(craftId, payload)
```

Then optionally verify:

```text
craftToEntry(craftId) == expectedEntry
```

Store:

```text
vesselEntry = expectedEntry
```

Important:

Do not rely on `vaultToEntry()` for entry-number arithmetic in the booking transaction.

Use `craftToEntry()` as the canonical counter.

The current Vessel source contains different array/index semantics across some read paths, so the integration should avoid unnecessary assumptions about raw array indexing.

---

# 66. VESSEL PAYLOAD

Use a versioned ABI-encoded payload.

Do not store a giant JSON string.

Define:

```solidity
bytes4 public constant MANIFEST_MAGIC = 0x45544841; // example
uint8 public constant MANIFEST_VERSION = 1;
```

Conceptual payload:

```solidity
abi.encode(
    MANIFEST_MAGIC,
    MANIFEST_VERSION,
    address(this),
    expectedEntry,
    seatId,
    msg.sender,
    fullName,
    dateOfBirth,
    twitterHandle,
    bagCount,
    totalPaid,
    block.timestamp,
    "Current Location",
    "Ethereum",
    "Round Trip",
    "Now",
    "ETH001"
)
```

The exact schema may be optimized, but it must remain:

- versioned,
- documented,
- deterministic,
- decodable.

Create a Solidity or TypeScript decoder test.

Document the final tuple types in README.

---

# 67. PAYLOAD REPRODUCIBILITY

Expose a view function that creates the canonical payload for a minted pass if practical.

Example:

```solidity
function vesselPayloadFor(
    uint256 tokenId
)
    external
    view
    returns (bytes memory);
```

If exact `block.timestamp` is part of the original payload, store it in the boarding-pass data so reproduction is exact.

The function should reproduce the original bytes.

This makes the Vessel entry independently verifiable.

---

# 68. VESSEL CRAFT MIGRATION

The current Vessel eventually supports locking semantics.

Do not assume one manifest Vault remains writable forever.

Allow the contract owner to change the active manifest Craft only under controlled conditions.

Example:

```solidity
function setVesselCraftId(
    uint16 newCraftId
)
    external
    onlyOwner
    whenPaused;
```

Before accepting new Craft:

- verify it is a Vault,
- verify it is not locked,
- verify its delegate is this BoardingPass contract.

Emit:

```solidity
event VesselCraftUpdated(
    uint256 indexed oldCraftId,
    uint256 indexed newCraftId
);
```

Historic boarding passes store the specific Craft ID and entry used at mint time.

Do not rewrite historic records.

---

# 69. VESSEL ADDRESS

Prefer the Vessel contract address as immutable constructor configuration.

This lets:

- local tests use MockVessel,
- production deploy use the real Vessel,
- application avoid an owner being able to silently swap the protocol dependency.

Example conceptually:

```solidity
IVESSEL public immutable VESSEL;
```

The active Craft ID may remain configurable because Vault locking/migration is a known operational need.

Follow installed ETH security rules if they recommend a different but equally safe pattern.

---

# 70. RENDERER

Create:

```text
BoardingPassRenderer.sol
```

The renderer should be separate from core booking/payment logic.

`BoardingPass.tokenURI(tokenId)` delegates to the renderer.

Renderer reads canonical BoardingPass data through `IBoardingPass`.

Do not duplicate mutable passenger data in both contracts.

---

# 71. FULLY ONCHAIN TOKEN URI

Return:

```text
data:application/json;base64,...
```

Image:

```text
data:image/svg+xml;base64,...
```

Do not require:

- IPFS
- centralized metadata API
- centralized image server
- Cloudinary
- S3

The primary NFT artwork should render from contract state.

---

# 72. BOARDING PASS SVG

Create a landscape SVG approximately:

```text
1200 × 600
```

It should look like a sophisticated physical airline boarding pass.

Information:

```text
ETHEREUM AIRWAYS
BOARDING PASS

PASSENGER
STEPHEN SANTORO

CURRENT LOCATION  →  ETHEREUM

FLIGHT
ETH001

WHEN
NOW

TRIP
ROUND TRIP

SEAT
12A

SEAT TYPE
WINDOW

BAGS
1

DATE OF BIRTH
1998-05-12

BIRTHDAY
MAY 12

X
@username

VESSEL
CRAFT #8421
ENTRY #37
```

Use an original airline identity.

Do not make it resemble an NFT trading card.

---

# 73. SVG DESIGN DETAILS

Use:

- typographic hierarchy
- destination emphasis
- boarding-pass perforation/divider
- subtle cut/notch motif
- seat number emphasis
- restrained airline accent
- small token ID
- small shortened traveler wallet
- decorative machine-readable pattern
- sensible whitespace

The destination and seat should be readable even at thumbnail scale.

---

# 74. DETERMINISTIC SECURITY PATTERN

Create a visual barcode/matrix-like pattern from:

```solidity
keccak256(
    abi.encode(
        tokenId,
        traveler,
        vesselCraftId,
        vesselEntry
    )
)
```

Use bits of the hash to render deterministic cells/lines.

Do not label it a QR code unless it implements a valid QR standard.

---

# 75. SVG/XML ESCAPING

This is a security requirement.

Passenger strings are user-controlled.

Never inject raw strings into SVG/XML.

Create and test:

```text
SvgEscape.sol
```

Escape at least:

```text
&
<
>
"
'
```

Test malicious values such as:

```text
<script>alert(1)</script>
A&B
" onclick="alert(1)
```

The resulting SVG must remain inert text.

---

# 76. JSON ESCAPING

Metadata JSON also contains user-controlled strings.

Do not create invalid JSON.

Escape:

- backslash
- quote
- control characters as needed

Either use a tested JSON escaping helper or constrain/encode the values safely.

Add tests that decode the Base64 JSON and verify it is valid.

---

# 77. TOKEN METADATA

Include attributes such as:

```text
Destination: Ethereum
Origin: Current Location
Trip: Round Trip
Flight: ETH001
Seat: 12A
Seat Type: Window
Cabin: Main
Bags: 1
Vessel Craft: 8421
Vessel Entry: 37
```

Intentionally include the requested passenger fields.

Description should clearly state that the pass is an onchain boarding pass to Ethereum.

---

# 78. RENDERER CONFIGURATION

During development, allow renderer updates by the contract owner.

Provide a one-way renderer freeze.

Example concept:

```solidity
function freezeRenderer() external onlyOwner;
```

Once frozen:

```text
renderer address can never change again
```

Do not freeze during initial development or first deployment automatically.

Emit:

```text
RendererUpdated
RendererFrozen
```

---

# 79. EVENTS

Emit one event optimized for Convex/event indexing.

Example:

```solidity
event BoardingPassMinted(
    address indexed traveler,
    uint256 indexed tokenId,
    uint16 indexed seatId,
    uint256 totalPaid,
    uint16 bagCount,
    uint256 vesselCraftId,
    uint256 vesselEntry
);
```

Do not duplicate every dynamic passenger string into logs unnecessarily.

The indexer can read the full record from the contract after finding the event.

Also emit operational events such as:

```text
RendererUpdated
RendererFrozen
VesselCraftUpdated
TreasuryUpdated
```

if those features exist.

---

# 80. CUSTOM ERRORS

Use custom errors for predictable failures.

Examples:

```solidity
error InvalidSeat(uint16 seatId);
error SeatAlreadyClaimed(uint16 seatId);
error InvalidName();
error InvalidDateOfBirth(uint32 dateOfBirth);
error InvalidTwitterHandle();
error IncorrectPayment(uint256 expected, uint256 received);
error VesselCraftNotVault(uint256 craftId);
error VesselCraftLocked(uint256 craftId);
error VesselDelegateMismatch(address expected, address actual);
error VesselPayloadTooLarge(uint256 length, uint256 capacity);
error RendererFrozen();
```

Frontend should decode these into airline-language messages.

---

# 81. CONTRACT PAYMENT STORAGE / WITHDRAWAL

Use a simple treasury model.

Either:

- ETH accumulates in BoardingPass then owner withdraws to configured treasury, or
- safely route payment to a treasury.

Prefer the simpler pattern supported by the installed ETH rules.

If funds accumulate:

```solidity
function withdraw()
    external
    onlyOwner
    nonReentrant;
```

Use `.call`.

Check success.

Do not add arbitrary refund logic.

Exact payment prevents accidental overpayment.

---

# 82. CONTRACT TESTS — BASIC

At minimum test:

## Seat existence

```text
1A  valid
1B  invalid
1C  valid
4F  valid
5B  valid
10E valid
12A valid
32F valid
33A invalid
0A  invalid
```

## Token identity

```text
seat 12A → tokenId 121
```

## Seat position

```text
A/F window
C/D aisle
B/E middle
```

## First Class geometry

B/E invalid rows 1–4.

---

# 83. CONTRACT TESTS — PRICING

Test exact expected prices.

Examples:

```text
1A  = 0.060 ETH
4F  = 0.045 ETH
5A  = 0.030 ETH
9E  = 0.022 ETH
10A = 0.018 ETH
11F = 0.016 ETH
12A = 0.009 ETH
12B = 0.006 ETH
24C = 0.003 ETH
24E = 0.002 ETH
25A = 0.001 ETH
32F = 0.00016 ETH
32E = 0.00008 ETH
```

Test hierarchy invariants.

---

# 84. CONTRACT FUZZ TESTS

Use Foundry fuzzing.

Examples:

## Seat ID fuzz

For arbitrary `uint16`:

- if `seatExists` false, booking must revert InvalidSeat,
- if valid, seat label/position functions must not revert.

## Quote invariant

For any valid seat and any `uint16 bagCount`:

```text
quote ==
BASE_FARE + seatPrice + BAG_PRICE * bagCount
```

## Exact payment

For valid booking:

```text
msg.value = quote
```

succeeds.

Any:

```text
quote - 1
quote + 1
```

reverts.

---

# 85. CONTRACT INVARIANT TESTS

Add stateful/invariant tests where useful.

At minimum target:

## Seat uniqueness

No valid execution sequence can mint the same `seatId` twice.

## Token/seat identity

For every minted token:

```text
tokenId == stored seatId
```

## Payment correctness

Every successful mint's stored `totalPaid` equals the contract quote at mint parameters.

## Vessel linkage

Every successful mint has:

```text
vesselCraftId != 0
vesselEntry != 0
```

and the mock Vault entry counter advanced.

---

# 86. MOCK VESSEL

Create a Foundry mock that implements the exact IVESSEL methods used by BoardingPass.

Support:

- Vault status
- locked status
- delegate
- Craft ID/capacity semantics
- payload append
- entry counter
- `setDelegate`
- optional raw payload retrieval for tests

Do not make a mock with a different API from production.

The mock should intentionally reproduce:

```text
payload.length <= craftId
```

and:

```text
Vault write increments craftToEntry
```

---

# 87. VESSEL FAILURE TESTS

Test:

- not a Vault → entire booking reverts
- locked Craft → entire booking reverts
- wrong delegate → entire booking reverts
- payload too large → entire booking reverts
- MockVessel explicit write failure → entire booking reverts

After each failed booking verify:

```text
seat remains available
token does not exist
contract balance unchanged
Vessel entry unchanged
```

This proves atomicity.

---

# 88. MAINNET FORK TESTS

If an Ethereum RPC is available, add read-only mainnet-fork tests for the real Vessel address.

Verify the production interface responds to:

```text
craftToVaultStatus
craftToLocked
craftToDelegate
craftToEntry
```

against an environment-configured candidate Craft ID.

Do not hardcode an unknown Craft as the production manifest unless its ownership/type/delegate state has been verified.

If testing actual writes on a fork requires impersonating the real owner, keep that test explicitly fork-only and never use a real private key.

---

# 89. RENDERER TESTS

Test:

- tokenURI exists only for minted token
- JSON Base64 decodes
- JSON parses
- SVG Base64 decodes
- SVG contains expected passenger
- SVG contains destination
- SVG contains seat
- SVG contains seat type
- SVG contains bags
- SVG contains DOB
- SVG contains birthday
- SVG contains Vessel Craft
- SVG contains Vessel Entry
- deterministic pattern is deterministic
- malicious XML input is escaped
- malicious JSON input does not break metadata

Consider snapshot-like deterministic hash tests for known data.

---

# 90. CONVEX SCHEMA

Use a schema approximately like the following, adapted to actual Convex syntax.

## `bookingSessions`

Fields:

```text
sessionId
walletAddress?
status

flightNumber
origin
destination
tripType
departure

baseFareWei

selectedSeatId?
selectedSeatLabel?
selectedSeatPriceWei?

bagCount

createdAt
updatedAt
```

Store wei as decimal string when crossing JSON/database boundaries.

Indexes:

```text
by_sessionId
by_walletAddress
by_status
```

---

# 91. CONVEX PASSENGER DRAFTS

Table:

```text
passengerDrafts
```

Fields:

```text
sessionId
fullName
dateOfBirthISO
twitterHandle
updatedAt
```

Index:

```text
by_sessionId
```

Do not duplicate the same draft endlessly.

Use idempotent upsert behavior.

---

# 92. CONVEX SEAT INDEX

Table:

```text
seatIndex
```

Fields:

```text
seatId
seatLabel
row
column
cabin
seatPosition
priceWei
minted
ownerAddress?
tokenId?
txHash?
blockNumber?
updatedAt
```

Indexes:

```text
by_seatId
by_minted
by_ownerAddress
```

This is a cache/index.

It is not the contract authority.

---

# 93. CONVEX MINTS

Table:

```text
mints
```

Fields:

```text
chainId
contractAddress

tokenId
seatId
seatLabel
cabin
seatPosition

travelerAddress

fullName
dateOfBirthISO
twitterHandle

bagCount
totalPaidWei

txHash
blockNumber
blockTimestamp

vesselCraftId
vesselEntry

createdAt
```

Indexes:

```text
by_tokenId
by_seatId
by_txHash
by_travelerAddress
by_vessel_entry
```

Ensure the uniqueness/upsert strategy prevents duplicate event ingestion.

---

# 94. CONVEX SYNC STATE

Table:

```text
syncState
```

Fields:

```text
chainId
contractAddress
lastProcessedBlock
lastConfirmedBlock
updatedAt
```

Unique logical key:

```text
chainId + contractAddress
```

---

# 95. CONVEX INDEXING STRATEGY

Do not depend solely on:

```text
receipt success
→ browser mutation
```

The browser can close after the chain transaction confirms.

Implement two paths.

## Fast path

After transaction confirmation:

1. decode `BoardingPassMinted` from the receipt,
2. call Convex mutation,
3. upsert completed mint immediately.

## Reconciliation path

A Convex action/cron or a small app-owned server process periodically:

1. reads `lastProcessedBlock`,
2. determines a safe confirmed head,
3. requests `BoardingPassMinted` logs using viem,
4. reads full booking data from contract where needed,
5. upserts `mints`,
6. updates `seatIndex`,
7. advances sync state.

Processing must be idempotent.

Do not create duplicates if the browser fast path already indexed the transaction.

---

# 96. CONVEX RPC SAFETY

Do not expose a paid/private RPC credential through a public Nuxt runtime variable if it is only needed by the server/indexer.

Use a server-side Convex environment variable for the reconciliation RPC.

If the Convex runtime configuration requires Node for the chosen viem usage, configure that according to the current Convex docs rather than guessing.

Keep the frontend RPC configuration separate from server indexing credentials.

---

# 97. DATA AUTHORITY

Encode this principle into comments/README:

## Ethereum authoritative

- seat existence
- seat ownership
- NFT ownership
- fare math
- payment
- passenger canonical NFT record
- Vessel manifest write
- token metadata

## Convex derived/application state

- guest drafts
- fast seat index
- analytics
- searchable mint history
- sync cursor
- UI cache

If Convex and chain disagree:

```text
Ethereum wins.
```

---

# 98. SEAT LOADING STRATEGY

On `/seats`:

1. load static seat geometry instantly,
2. load Convex cached mint state,
3. perform authoritative batched contract availability read,
4. reconcile UI,
5. subscribe/react to Convex mint updates,
6. refresh chain availability after confirmed mints and at a sensible interval.

Do not poll every second.

Do not issue 184 independent wallet-provider prompts/calls.

One batch view call is preferred.

---

# 99. OPTIONAL SOFT HOLD

A short Convex-only soft hold can be implemented later.

Example:

```text
5-minute local reservation
```

But this is optional.

It must never be treated as ownership.

Contract ownership wins.

Do not let this feature delay core seat selection.

---

# 100. NUXT COMPONENT ORGANIZATION

Adapt to the existing repo.

A sensible Nuxt structure:

```text
app/
  pages/
    index.vue
    flights.vue
    traveler.vue
    seats.vue
    review.vue
    boarding-pass/
      [tokenId].vue

  components/
    airline/
      AirlineHeader.vue
      BookingSearch.vue
      BookingProgress.vue
      FlightResultCard.vue
      TripSummary.vue
      TravelerForm.vue
      AircraftSeatMap.vue
      AircraftSeat.vue
      SeatLegend.vue
      BaggageSelector.vue
      BookingReview.vue
      BoardingPassPreview.vue
      TransactionStatus.vue

  composables/
    useBooking.ts
    useBoardingPassContract.ts
    useSeatAvailability.ts
    useBookingQuote.ts

  lib/
    booking/
      flight.ts
      seats.ts
      seatPricing.ts
      dob.ts
    evm/
      abi.ts
      addresses.ts
      errors.ts
      receipt.ts
    format/
      eth.ts
      address.ts

  assets/
    css/
      airline.css

convex/
  schema.ts
  bookings.ts
  seats.ts
  mints.ts
  sync.ts
  crons.ts
```

If the repo uses Nuxt 3 root `pages/`, preserve that convention.

Do not migrate file structure just to match this example.

---

# 101. CONTRACT ABI IN NUXT

After `forge build`, export/copy the minimal ABI needed by the Nuxt app.

Do not manually maintain a huge ABI blob if it can be generated.

Prefer an automated script that extracts:

```text
BoardingPass ABI
```

from Foundry artifacts into an app-readable TypeScript/JSON location.

The frontend needs at least:

```text
bookAndMint
quote
seatPrice
seatExists
getSeatAvailability
boardingPassData/getBoardingPass
tokenURI
BoardingPassMinted event
```

Do not ship compiler bytecode to the frontend unless needed.

---

# 102. ABI TYPE SAFETY

Use viem-compatible typed ABI definitions.

If converting artifact JSON into `as const` TypeScript improves type inference, do that through a generated step.

Avoid repeated `as any`.

Do not suppress contract-call type errors just to compile.

---

# 103. CONTRACT COMPOSABLE

Create:

```text
useBoardingPassContract.ts
```

Responsibilities:

- resolve configured contract address
- expose current chain
- read quote
- read availability
- read boarding pass data
- simulate booking
- build final write request
- decode booking errors

Do not let page components construct low-level contract calls in five different places.

---

# 104. ERROR TRANSLATION

Map custom errors.

Examples:

```text
SeatAlreadyClaimed
→ "This seat was just claimed. Please choose another seat."

IncorrectPayment
→ "The fare changed. We've refreshed your total."

VesselCraftLocked
→ "Booking is temporarily unavailable."

VesselDelegateMismatch
→ "Booking is temporarily unavailable."

InvalidDateOfBirth
→ "Please check your date of birth."

UserRejectedRequestError
→ "Booking canceled. No charge was made."
```

Do not render Solidity selector hex codes to normal users.

Log technical detail for development.

---

# 105. WRONG NETWORK

If wallet is connected to a non-supported chain:

- preserve booking state,
- show network switch action,
- use 1001 `EvmSwitchNetwork`,
- disable purchase until correct.

Do not ask the user to disconnect.

---

# 106. TRANSACTION SIMULATION

Before opening/submitting the final transaction, simulate.

Simulation should catch:

- seat claimed
- bad input
- Vessel misconfiguration
- pause state
- incorrect quote assumptions

The actual transaction still performs the same validation.

Simulation does not replace contract enforcement.

---

# 107. TRANSACTION RECEIPT

After confirmation:

Decode:

```text
BoardingPassMinted
```

Extract:

```text
tokenId
seatId
totalPaid
bagCount
vesselCraftId
vesselEntry
```

Update booking state.

Attempt immediate Convex upsert.

Then navigate:

```text
/boarding-pass/[tokenId]
```

If Convex write fails but blockchain succeeded:

- do not show transaction failure,
- the chain transaction is authoritative,
- reconciliation will backfill,
- success page should read directly from contract as fallback.

---

# 108. BOARDING PASS SUCCESS PAGE

Route:

```text
/boarding-pass/[tokenId]
```

Display:

```text
Welcome aboard.
```

Large onchain SVG.

Trip:

```text
Current Location → Ethereum
```

Seat:

```text
12A
Window
```

Vessel:

```text
Craft #X
Entry #Y
```

Transaction:

```text
0x1234…abcd
```

Actions:

```text
View Transaction
View NFT
View Vessel
Copy Boarding Pass Link
```

Use configured explorer.

The page must work from a direct URL without requiring the previous booking state.

Read canonical token data from contract/Convex.

---

# 109. DIRECT NFT IMAGE RENDERING

The frontend can:

1. read `tokenURI(tokenId)`,
2. parse the base64 JSON,
3. render the `image` data URI.

Do not use the 1001 decentralized metadata stack unless needed; this metadata is already a normalized onchain data URI.

If `EvmArtifact` cleanly supports the resulting metadata, it may be used, but inspect actual behavior before relying on it.

A simple onchain-data renderer is acceptable.

---

# 110. ACCESSIBILITY

Implement:

- semantic form labels
- keyboard navigation
- visible focus states
- seat buttons
- aria labels
- disabled attributes
- status announcements for transaction state

Seat label examples:

```text
Seat 12A, Window, 0.009 ETH, available
```

```text
Seat 12A, unavailable
```

Do not rely on hover only.

---

# 111. SSR / CLIENT BOUNDARIES

Nuxt may server-render the page shell.

Wallet state and browser wallet APIs are client-dependent.

Avoid direct `window`/provider access during SSR.

Use:

- layer primitives,
- Nuxt client plugins when necessary,
- `<ClientOnly>` only where needed,
- client-safe composables.

Static aircraft geometry can render without wallet state.

Do not make the whole application client-only just to solve one wallet component.

---

# 112. PERFORMANCE

The seat map contains 184 seats.

This is not huge, but implement intelligently.

Avoid:

- each seat independently fetching RPC
- each seat independently subscribing to Convex
- rerendering the entire map for unrelated traveler form changes

Prefer:

- one seat-definition array
- one availability query
- one reactive availability map
- keyed seat components
- stable props
- memoized/derived structures

---

# 113. LOADING STATES

Design explicit states for:

- application boot
- Convex draft load
- seat cache load
- chain availability load
- wallet connecting
- network switching
- quote loading
- simulation
- wallet confirmation
- transaction pending
- receipt confirmed
- Convex indexing
- boarding-pass read

No blank screens.

No indefinite generic spinners without explanatory copy.

---

# 114. FAILURE STATES

Support:

- RPC failure
- Convex unavailable
- contract address missing
- wrong network
- insufficient ETH
- seat claimed
- user rejects transaction
- contract paused
- Vessel not Vault
- Vessel locked
- Vessel delegate removed
- payload too large
- renderer unavailable
- receipt/log decode unexpected

Separate:

```text
booking failed
```

from:

```text
booking succeeded but secondary indexing is delayed
```

Do not misrepresent chain success.

---

# 115. VISUAL POLISH CHECKLIST

The final app should pass:

## Header

- disconnected wallet
- connected wallet
- ENS/address display
- profile dropdown/dialog
- mobile nav

## Home

- hero
- search card
- focus/hover
- mobile booking form

## Flight result

- airline card hierarchy
- ETH price alignment
- selection

## Traveler

- input labels
- validation
- error messaging

## Seat map

- aircraft silhouette
- 2-2 first class
- 3-3 remaining cabins
- wings
- exits
- aisle
- selected state
- occupied state
- tooltip
- sticky summary

## Bags

- increment/decrement
- large values
- total update

## Review

- wallet gate
- privacy consent
- wrong-network state
- purchase CTA

## Success

- SVG
- explorer links
- direct route reload

---

# 116. PRODUCT MICROCOPY

Use restrained airline language.

Good:

```text
Where are you going?
```

```text
Choose your flight
```

```text
Traveler information
```

```text
Choose your seat
```

```text
Checked bags
```

```text
Review your trip
```

```text
Purchase Boarding Pass
```

```text
Confirm your booking in your wallet
```

```text
Booking your flight…
```

```text
You're cleared for Ethereum.
```

Avoid excessive jokes.

---

# 117. NO FAKE BLOCKCHAIN

Never:

- fake a tx hash
- fake a successful mint
- use Convex to mark a seat owned without chain evidence
- generate random occupied seats in production
- trust a frontend-provided price
- report success before a receipt
- skip the Vessel write
- write the Vessel payload in a second user transaction
- generate an offchain image and call it fully onchain

Mocks are allowed only in local development/testing and must be clearly separated from production configuration.

---

# 118. LOCAL DEVELOPMENT FLOW

Create a repeatable local setup.

Example:

1. start Anvil,
2. deploy MockVessel,
3. configure a mock high-capacity Vault Craft,
4. deploy BoardingPass,
5. set MockVessel delegate to BoardingPass,
6. deploy renderer,
7. set renderer,
8. write generated addresses into local environment/config,
9. start Convex dev,
10. start Nuxt dev,
11. connect local wallet,
12. complete an end-to-end booking.

Create scripts so this does not require copying addresses manually every run if avoidable.

---

# 119. FOUNDRY DEPLOY SCRIPT — LOCAL

`DeployLocal.s.sol` should:

- deploy MockVessel,
- configure Craft as Vault,
- make Craft unlocked,
- deploy BoardingPass using MockVessel,
- delegate Craft,
- deploy BoardingPassRenderer,
- configure renderer,
- emit/log addresses.

If the renderer constructor needs BoardingPass address, deploy in the correct order.

Do not freeze renderer locally.

---

# 120. PRODUCTION DEPLOYMENT PRECHECK

Before mainnet deployment, the operator must select a Vessel Craft.

Verify:

```text
ownerOf(craftId) == operator
craftToVaultStatus(craftId) == true
craftToLocked(craftId) == false
```

Check its ID/capacity is comfortably above encoded passenger payload length.

Do not guess the Craft.

Use `cast call` or an equivalent verified read.

---

# 121. PRODUCTION DEPLOYMENT

Recommended order:

1. identify verified high-capacity unlocked Vessel Vault,
2. deploy BoardingPass against real Vessel address and chosen Craft ID,
3. deploy BoardingPassRenderer,
4. set renderer,
5. Vessel Craft owner calls `setDelegate(craftId, boardingPassAddress)`,
6. verify delegate,
7. verify Vault status,
8. verify unlocked status,
9. read `craftToEntry`,
10. configure Nuxt production contract address,
11. configure Convex indexer contract address/start block,
12. perform one controlled low-risk booking,
13. verify:
   - exact ETH payment,
   - ERC-721 ownership,
   - stored passenger data,
   - Vessel entry increment,
   - onchain payload,
   - tokenURI JSON,
   - SVG,
   - Convex mint row,
   - seat cache,
   - direct boarding-pass page,
14. only after final renderer approval consider freezing renderer.

Do not renounce ownership prematurely.

---

# 122. DEPLOYMENT START BLOCK

Record the BoardingPass deployment block.

Convex reconciliation should not scan Ethereum from genesis.

Configuration should include a deployment start block or obtain it from deployment artifacts.

---

# 123. CONTRACT ARTIFACT OUTPUT

Store deployment output in a machine-readable file excluded/included appropriately.

Example:

```text
deployments/
  anvil.json
  mainnet.json
```

Fields:

```json
{
  "chainId": 1,
  "boardingPass": "0x...",
  "renderer": "0x...",
  "vessel": "0xECb...",
  "vesselCraftId": 8421,
  "deploymentBlock": 12345678
}
```

Do not put private keys in deployment artifacts.

---

# 124. FRONTEND TESTING

Use the test stack already present in the Nuxt repo.

If no frontend test framework exists, choose a minimal Vue/Nuxt-compatible stack.

Do not install a huge testing framework unnecessarily.

At minimum test:

## Booking state

- navigation preserves values
- bigint persistence conversion is correct

## Traveler

- `@username` normalizes
- DOB converts correctly

## Pricing mirror

- known seats calculate expected price
- all contract/mirror prices match in integration test

## Seat component

- occupied disabled
- selected state
- ARIA label

## Total

- base + seat + bags

---

# 125. END-TO-END TESTS

If the repo has Playwright, use it.

Otherwise add it only if appropriate.

Important flow:

1. homepage,
2. Search Flights,
3. Select,
4. traveler details,
5. continue,
6. select seat,
7. add bag,
8. review,
9. connect local Anvil wallet,
10. purchase,
11. transaction confirms,
12. success page loads correct token.

Also test:

- guest can reach review,
- disconnected cannot purchase,
- wrong chain blocks purchase,
- occupied seat cannot select,
- race/seat claimed preserves traveler data.

---

# 126. RACE CONDITION

Two users may select the same seat.

The UI may show both users a temporarily available seat.

That is okay.

The contract is the final arbiter.

Only one transaction can mint the token.

Second booking reverts:

```text
SeatAlreadyClaimed
```

Frontend:

```text
This seat was just claimed. Please choose another seat.
```

Keep:

- traveler
- bags

Reset only:

- selected seat

Navigate back to seat map.

---

# 127. PRIVACY TEST

Verify the user cannot submit without consent in the official UI.

Also make clear:

- the smart contract cannot technically verify a browser checkbox,
- the checkbox is product disclosure/consent UX,
- direct contract callers can bypass UI.

Do not pretend UI consent is an onchain permission primitive.

---

# 128. SECURITY REVIEW PASS

Before considering Solidity complete, review specifically:

- `bookAndMint` external call ordering
- reentrancy
- `_safeMint` receiver callback behavior
- Vessel external call
- exact payment
- owner withdrawals
- pause controls
- renderer mutability
- Vessel Craft migration
- integer casts
- bag multiplication
- string bounds
- DOB parsing
- malicious SVG/XML strings
- malicious JSON strings
- external contract trust
- token existence checks
- event correctness

Follow installed ETH skills.

---

# 129. RECOMMENDED BOOKING CALL ORDER

Use the final ordering dictated by ETH skills, but a good baseline is:

```text
validate input
validate seat availability
calculate quote
validate msg.value
validate Vessel readiness
compute expected Vessel entry
build Vessel payload
validate payload capacity
perform Vessel append
verify entry counter if desired
store BoardingPassData
_safeMint(msg.sender, seatId)
emit BoardingPassMinted
```

Because any later revert rolls back the Vessel call, atomicity remains intact.

`nonReentrant` protects the entire external entry point.

The Vessel address should be trusted/immutable production infrastructure.

If installed security rules prefer effects before external interaction, reason explicitly about the external Vessel call and `_safeMint` callback and structure accordingly while preserving atomic behavior.

---

# 130. CONTRACT PAUSE

Owner should be able to pause booking.

Pause should stop new `bookAndMint` calls.

Do not block:

- ERC-721 view functions
- tokenURI
- existing ownership reads

Decide whether transfers remain allowed while booking is paused.

Default recommendation:

```text
pause affects booking only,
not ordinary ERC-721 transfer.
```

Unless local ETH rules suggest otherwise.

---

# 131. CONTRACT READ API

Expose clean reads so Nuxt does not inspect raw mappings awkwardly.

Recommended:

```solidity
function getBoardingPass(
    uint256 tokenId
)
    external
    view
    returns (BoardingPassData memory);
```

```solidity
function seatExists(
    uint16 seatId
)
    public
    pure
    returns (bool);
```

```solidity
function seatLabel(
    uint16 seatId
)
    public
    pure
    returns (string memory);
```

```solidity
function seatPrice(
    uint16 seatId
)
    public
    pure
    returns (uint256);
```

```solidity
function quote(
    uint16 seatId,
    uint16 bagCount
)
    public
    pure
    returns (uint256);
```

```solidity
function isSeatAvailable(
    uint16 seatId
)
    public
    view
    returns (bool);
```

```solidity
function getSeatAvailability(
    uint16[] calldata seatIds
)
    external
    view
    returns (bool[] memory);
```

---

# 132. CONTRACT SOURCE OF SEAT GEOMETRY

Implement seat geometry once in a Solidity library or pure internal functions.

Avoid inconsistent logic across:

```text
seatExists
seatLabel
seatPrice
seatPosition
cabin
```

`SeatLib.sol` should be a strong candidate.

The TypeScript seat-definition file mirrors geometry for presentation and is tested against contract behavior.

---

# 133. NUXT STATIC SEAT DEFINITIONS

Create a deterministic array of 184 valid seat objects.

Example:

```ts
interface SeatDefinition {
  seatId: number
  row: number
  column: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  label: string
  cabin: 'first' | 'comfort' | 'exit' | 'main' | 'rear'
  position: 'window' | 'middle' | 'aisle'
}
```

Generate it programmatically from row rules rather than manually typing 184 objects.

Keep output stable.

---

# 134. SEAT UI COLOR/STYLE

Use visual hierarchy by cabin.

Do not create a rainbow airplane.

Use subtle differences:

- First Class: strongest premium accent
- Comfort: secondary premium tone
- Exit: visible outline / exit treatment
- Main: neutral
- Rear: neutral/muted
- Occupied: gray + unavailable pattern
- Selected: strong high-contrast active state

Use shape/icon/pattern differences in addition to color.

---

# 135. AIRCRAFT DETAILS

Add:

```text
Front
↓
Cockpit / nose cue
Front galley
First Class divider
Comfort divider
Wings
EXIT
Main Cabin
Rear Cabin
Rear galley
Tail
```

The page should feel intentional at a glance even before reading labels.

---

# 136. NO AIRLINE DATE PICKER COMPLEXITY

"Now" is fixed.

Do not build a real calendar.

Do not build return-date logic.

Do not build passenger-count complexity.

Present those fields with real airline visual styling while keeping the domain intentionally fixed.

---

# 137. CART/TOTAL

Cart state must react immediately to:

- flight selected,
- seat change,
- bag count.

Display:

```text
Base fare
Seat
Bags
Total
```

Never include gas in the application fare total.

Wallet may separately estimate gas.

Do not add gas to the amount sent as `msg.value`.

---

# 138. CONVEX PII

Because the user intentionally wants traveler data in Convex for indexing, store it deliberately.

Do not falsely describe Convex as private encrypted storage.

Use reasonable access patterns and do not create public unauthenticated list-all-passenger endpoints unless the product needs them.

Completed blockchain data is public, but the application does not need to make harvesting easier.

Expose only the queries needed by UI.

---

# 139. CONVEX GUEST MUTATION ABUSE

Guest draft mutations are unauthenticated.

Add sane validation:

- session ID format/length
- string size
- bag count bounds
- known flight constants
- seat ID shape

Do not allow arbitrary massive strings to be stored.

If rate limiting is already available in the repo, use it.

Do not over-engineer auth solely for drafts.

---

# 140. CONVEX COMPLETED BOOKING TRUST

Do not trust client-submitted completed booking fields.

For completed mints:

- receipt/event identifies tx/token,
- server/indexer reads authoritative contract state,
- Convex stores verified values.

The browser fast-path may submit tx hash/token ID, but the mutation/action should validate or later reconcile against chain.

Do not let a client claim:

```text
I own seat 1A
```

without chain evidence.

---

# 141. CURRENT VESSEL DATA MODEL NOTES

The current Vessel:

- is Ethereum mainnet,
- uses ERC-721 Crafts,
- has a byte capacity equal to each Craft token ID,
- exposes Vault status,
- exposes lock status,
- exposes delegation,
- lets holder/delegate call `setPayloadHolder`,
- appends a new payload for Vaults,
- increments the Vault entry counter on append.

Build against the actual production interface.

Do not assume future protocol changes.

Keep address and Craft ID configurable.

---

# 142. README

Write a real README.

Sections:

## Product

Explain Current Location → Ethereum.

## Stack

```text
Nuxt / Vue
@1001-digital/layers.evm
Convex
Foundry
OpenZeppelin 5
Ethereum
The Vessel
```

## Architecture

```text
┌────────────────────────────┐
│ Nuxt Airline UI            │
│ 1001 EVM Layer             │
└─────────────┬──────────────┘
              │
      wallet transaction
              │
              ▼
┌────────────────────────────┐
│ BoardingPass ERC-721       │
│ pricing + seat ownership   │
└─────────────┬──────────────┘
              │
      delegated Vault write
              │
              ▼
┌────────────────────────────┐
│ The Vessel Vault           │
│ permanent flight manifest  │
└────────────────────────────┘

             events
              │
              ▼
┌────────────────────────────┐
│ Convex                     │
│ drafts + index + cache     │
└────────────────────────────┘
```

## Source of truth

Ethereum vs Convex.

## Seat model

184 seats and token IDs.

## Pricing

Exact formula.

## Vessel payload schema

Exact ABI tuple.

## Local development

Commands.

## Foundry testing

Commands.

## Deployment

Mainnet process.

## Privacy

Permanent onchain PII warning.

---

# 143. IMPLEMENTATION PHASES

Work in this order.

## Phase 0 — Repository/rules preflight

- inspect repo,
- read installed Cursor ETH rules,
- read 1001 `llms.txt`,
- read 1001 layers guide,
- inspect existing Foundry,
- inspect existing Convex.

Deliver internal architecture checklist before making broad changes.

## Phase 1 — Nuxt EVM foundation

- ensure `@1001-digital/layers.evm`,
- configure chain,
- configure wallet,
- configure app theme,
- ensure connected/disconnected UI works.

## Phase 2 — Product/domain constants

- flight constants,
- seat geometry,
- TS pricing,
- DOB normalization,
- booking state.

## Phase 3 — Solidity seat library

- seat existence,
- label,
- cabin,
- position,
- pricing,
- quote.

Test it immediately.

## Phase 4 — MockVessel

- exact needed interface,
- Vault semantics,
- delegate,
- lock,
- capacity,
- entry append.

## Phase 5 — BoardingPass core

- inputs,
- payment,
- ERC-721,
- Vessel append,
- events,
- owner controls.

Run Foundry tests.

## Phase 6 — Renderer

- SVG,
- tokenURI,
- escaping,
- renderer freeze.

Run Foundry tests.

## Phase 7 — Convex

- schema,
- drafts,
- seat index,
- mint index,
- sync state,
- reconciliation.

## Phase 8 — Nuxt airline flow

- homepage,
- flights,
- traveler,
- progress,
- trip summary.

## Phase 9 — Seat map

Spend the largest front-end effort here.

- plane silhouette,
- sections,
- seats,
- availability,
- tooltip,
- selected state,
- bags,
- responsive UX.

## Phase 10 — Contract integration

- generated ABI,
- reads,
- availability,
- quote,
- simulation,
- transaction flow.

## Phase 11 — Checkout

- privacy consent,
- connect wallet,
- network switch,
- one transaction,
- receipt decode,
- error translation.

## Phase 12 — Convex chain sync

- immediate receipt upsert,
- server reconciliation,
- idempotency.

## Phase 13 — Boarding pass page

- direct contract read,
- metadata decode,
- SVG,
- Vessel/tx links.

## Phase 14 — QA

- Foundry,
- typecheck,
- lint,
- frontend tests,
- E2E,
- production build,
- desktop/mobile,
- wallet dialogs,
- error states.

---

# 144. SHIP COMMANDS

Run the repo's actual scripts.

At minimum equivalents of:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build

forge fmt --check
forge build
forge test
```

If package manager is not pnpm, use the repository's existing package manager.

Do not silently switch package managers.

---

# 145. DEFINITION OF DONE

The feature is not complete unless:

- Nuxt/Vue remains the app framework.
- `@1001-digital/layers.evm` is the EVM foundation.
- 1001 wallet/account/transaction primitives are used where appropriate.
- Existing ETH Cursor rules were followed.
- Foundry tests pass.
- Convex uses the Nuxt integration.
- Homepage looks like a polished airline product.
- Search is Current Location → Ethereum.
- Trip is Round Trip.
- When is Now.
- Base fare is 0.001 ETH.
- Guest can reach review without wallet.
- Wallet is required to buy.
- No unnecessary SIWE signature.
- Traveler enters DOB once.
- Birthday is derived.
- Traveler info is indexed in Convex.
- Plane seat map is visually an aircraft.
- First Class uses 2-2.
- Rows 5–32 use 3-3.
- Emergency rows are 10–11.
- All 184 seats have deterministic IDs.
- tokenId equals seatId.
- Contract owns authoritative availability.
- Contract owns authoritative seat price.
- First Class is most expensive.
- Comfort follows.
- Exit rows follow.
- Window/aisle exceed middle in main cabin.
- Rear seats approach nearly free.
- Bags cost exactly 0.01 ETH each.
- Cart math uses wei/bigint.
- Final `msg.value` comes from contract quote.
- One customer transaction performs booking + mint + Vessel write.
- Same seat cannot mint twice.
- Failed Vessel write reverts entire booking.
- Vessel Craft is verified as a Vault.
- BoardingPass is the delegated Vessel writer.
- Each booking appends one Vessel Vault entry.
- Passenger payload respects Craft byte capacity.
- NFT stores Vessel Craft and entry reference.
- Convex indexing is idempotent.
- Browser-close-after-mint can be reconciled.
- tokenURI is fully onchain.
- SVG is fully onchain.
- Passenger strings are SVG escaped.
- JSON metadata remains valid.
- Boarding pass shows:
  - name,
  - DOB,
  - birthday,
  - X handle,
  - origin,
  - Ethereum destination,
  - flight,
  - trip,
  - seat,
  - seat type,
  - bags,
  - Vessel Craft,
  - Vessel Entry.
- Mobile seat selection works.
- Wallet wrong-network state works.
- Transaction rejection works.
- Seat-race failure works.
- Success page works from direct URL.
- No fake blockchain behavior remains in production code.
- Production build passes.

---

# 146. FINAL ENGINEERING PRINCIPLES

Prioritize:

1. **Nuxt EVM correctness**
2. **airline illusion**
3. **seat-map quality**
4. **single-transaction checkout**
5. **contract-authoritative pricing and ownership**
6. **atomic Vessel integration**
7. **fully onchain boarding-pass renderer**
8. **Convex as an index, never ownership authority**
9. **Foundry security/testing discipline**
10. **simple, maintainable architecture**

Do not add abstractions because they sound sophisticated.

Do not install every 1001 block.

Do not make the user understand blockchain plumbing.

The final experience should feel like:

```text
Search flight
→ enter passenger
→ choose seat
→ add bags
→ review
→ connect wallet
→ purchase
→ receive boarding pass
```

while the underlying transaction performs the sophisticated onchain work correctly.

---

# 147. FIRST ACTION FOR THE CURSOR AGENT

Start by inspecting the repository and reporting internally:

```text
Framework:
Nuxt version:
Vue version:
Package manager:
1001 layer installed:
1001 layer version:
Convex installed:
convex-nuxt installed:
Foundry configured:
OpenZeppelin version:
ETH rules discovered:
Wallet config location:
Contract folder:
Target chain config:
Missing required dependencies:
```

Then proceed with the implementation phases above.

Do not replace existing working architecture simply because this prompt contains example paths.

When exact 1001 API details matter, inspect the currently installed package/source before writing code.

When exact Vessel API details matter, use the official current `IVESSEL.sol` and production contract behavior.

When Solidity design details matter, follow the installed ETH skills and prove correctness with Foundry tests.

Build the complete system.
