# Plan 12 — Contract integration, quote, and checkout transaction

## Goal

Wire the app to the deployed contract: generated ABI, batched availability, authoritative quote,
simulation, and exactly one wallet transaction through the 1001 transaction flow.

## Prerequisites

Plans 08 and 11 done, and a local Anvil deployment available (plan 14 formalizes the script; a
throwaway local deploy is enough to develop against).

## Tasks

1. `scripts/sync-abi.ts` run by `pnpm abi:sync` — reads `contracts/out/BoardingPass.sol/
   BoardingPass.json`, extracts only `bookAndMint`, `quote`, `seatPrice`, `seatExists`,
   `isSeatAvailable`, `getSeatAvailability`, `getBoardingPass`, `tokenURI`, the
   `BoardingPassMinted` event, and every custom error, then writes
   `app/lib/evm/abi/boardingPass.ts` as a viem-typed `as const` export. No bytecode shipped, no
   hand-maintained ABI blob, no `as any`.
2. `app/composables/useBoardingPassContract.ts` — the only place low-level calls are constructed:
   - resolves the address and chain from `app/lib/evm/chains.ts`
   - `readQuote(seatId, bagCount)`, `readAvailability(seatIds)`, `readBoardingPass(tokenId)`,
     `readTokenUri(tokenId)` via `readContract` from `@wagmi/core`
   - `simulateBooking(args)` via `simulateContract`
   - `submitBooking(args)` via `writeContract` using the **contract-returned** quote as `value`
   - `decodeBookingError(error)` mapping custom errors to copy
   Page components never call `readContract`/`writeContract` directly.
3. Replace the plan 11 availability stub with the real batched `getSeatAvailability(SEAT_IDS)` —
   one `eth_call` for all 184 seats, contract result overriding the Convex cache.
4. `app/composables/useBookingQuote.ts` — reads the authoritative quote on `/review` entry and
   whenever seat or bag count changes; exposes `quoteWei`, `status`, `refresh`. The TS mirror is
   used only for instant hover pricing and is never sent as `value`.
5. `app/pages/review.vue`:
   - `BookingProgress step="review"`; sections Flight, Traveler, Seat (with priority label such as
     `Emergency Exit Row`), Extras, Payment
   - on entry, read the quote; if the seat has been claimed, keep traveler and bags, clear only the
     seat, show `This seat was just claimed. Please choose another seat.`, route to `/seats`
   - privacy consent checkbox with the exact copy from brief §25; purchase disabled until checked.
     Comment in code and README that this is product disclosure, not an onchain permission — direct
     contract callers bypass it.
   - wallet gate: disconnected → `Connect Wallet to Book` via `EvmConnectDialog`; after connecting,
     stay on review with state intact and reveal the purchase CTA
   - wrong network → `EvmSwitchNetwork`, purchase disabled, never ask the user to disconnect
   - CTA `Purchase Boarding Pass · 0.020 ETH` using the authoritative quote
6. Transaction via `EvmTransactionFlowDialog` (exact props/slots per `docs/1001-layer-notes.md`).
   The request function: verify connection → verify chain → read `quote` → `simulateContract` →
   `writeContract` with the exact quoted value. Exactly one wallet transaction.
7. `app/lib/evm/errors.ts` — airline-language translations:
   `SeatAlreadyClaimed` → "This seat was just claimed. Please choose another seat."
   `IncorrectPayment` → "The fare changed. We've refreshed your total."
   `VesselCraftLocked` / `VesselDelegateMismatch` / `VesselCraftNotVault` → "Booking is temporarily
   unavailable." `InvalidDateOfBirth` → "Please check your date of birth."
   `UserRejectedRequestError` → "Booking canceled. No charge was made."
   Unknown → generic message plus a dev-only console detail. Never render a selector hex.
8. Transaction copy: `Confirm your booking in your wallet`, `Booking your flight…`,
   `You're cleared for Ethereum.` No contract vocabulary. Never show success before a receipt.
9. `aria-live` status region announcing each transaction state transition.
10. Cross-check test: a Vitest integration test against local Anvil comparing the TypeScript mirror
    price to `seatPrice` for **all 184 seats**, and `quoteWei` to `quote` for a sample of bag
    counts. Any divergence fails the suite.

## Verification

```bash
pnpm abi:sync
pnpm typecheck
pnpm test
pnpm dev
```

Against Anvil: book a seat end to end; reject in the wallet; attempt a seat already minted from a
second account; connect to the wrong chain and confirm purchase stays disabled.

## Done criteria

- All 184 TS/Solidity prices match in the integration test.
- `msg.value` always originates from the contract quote.
- One transaction performs booking + mint + Vessel write.
- Every mapped error renders airline copy, no hex selectors.
- Purchase impossible while disconnected, on the wrong chain, or without consent.

## Commit

`feat: contract reads, authoritative quote, and single-transaction checkout`
