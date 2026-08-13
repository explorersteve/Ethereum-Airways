# Plan 09 — Convex data layer

## Goal

Convex as drafts store, seat cache, mint index, and sync cursor for deployment
`diligent-seahorse-531`. Never an ownership authority.

## Prerequisites

Plan 03 done (shared seat/format helpers). Contracts not required yet.

## Deployment

- Cloud URL `https://diligent-seahorse-531.convex.cloud`
- HTTP actions `https://diligent-seahorse-531.convex.site`

## Tasks

1. `npx convex dev` once to generate `convex/_generated`. Register `convex-nuxt` with the public
   URL from runtime config. Confirm the composable names in the installed `convex-nuxt` version
   (`useConvexQuery` and the current mutation/action equivalents) before using them — do not guess.
2. `convex/schema.ts` — all wei values stored as **decimal strings**, all tables indexed:
   - `bookingSessions`: sessionId, walletAddress?, status, flight fields, baseFareWei,
     selectedSeatId?, selectedSeatLabel?, selectedSeatPriceWei?, bagCount, createdAt, updatedAt.
     Indexes `by_sessionId`, `by_walletAddress`, `by_status`.
   - `passengerDrafts`: sessionId, fullName, dateOfBirthISO, twitterHandle, updatedAt.
     Index `by_sessionId`.
   - `seatIndex`: seatId, seatLabel, row, column, cabin, seatPosition, priceWei, minted,
     ownerAddress?, tokenId?, txHash?, blockNumber?, updatedAt. Indexes `by_seatId`, `by_minted`,
     `by_ownerAddress`.
   - `mints`: chainId, contractAddress, tokenId, seatId, seatLabel, cabin, seatPosition,
     travelerAddress, fullName, dateOfBirthISO, twitterHandle, bagCount, totalPaidWei, txHash,
     blockNumber, blockTimestamp, vesselCraftId, vesselEntry, createdAt. Indexes `by_tokenId`,
     `by_seatId`, `by_txHash`, `by_travelerAddress`, `by_vessel_entry`, and
     `by_chain_contract_token` for idempotency.
   - `syncState`: chainId, contractAddress, lastProcessedBlock, lastConfirmedBlock, updatedAt.
     Index `by_chain_contract`.
3. Every public function declares `args` **and** `returns` validators. Keep handlers thin; put
   logic in plain TypeScript helpers under `convex/lib/`.
4. `convex/bookings.ts`:
   - `upsertSession` mutation — idempotent on `sessionId` via `by_sessionId`; validates session id
     format (UUID, fixed length), enforces flight constants match, bag count `0…65535`,
     seat id shape via a shared seat-validity helper
   - `savePassengerDraft` mutation — idempotent upsert, name <= 48 bytes, handle <= 32 bytes,
     ISO date validated; rejects oversized strings outright
   - `getSession` query by sessionId returning session + draft, or null
5. `convex/seats.ts`:
   - `seedSeatIndex` internal mutation generating all 184 rows from the same geometry rules
   - `listSeatIndex` query returning the minimal shape the seat map needs (seatId, minted,
     ownerAddress?) — never the passenger fields
   - `markSeatMinted` internal mutation used only by verified sync paths
6. `convex/mints.ts`:
   - `recordMint` mutation (browser fast path) taking chainId, contractAddress, txHash, tokenId —
     it stores a `pending` row and schedules `internal.sync.verifyMint`; it does **not** trust
     client-supplied passenger data or prices
   - `getMintByTokenId`, `listMintsByOwner` queries exposing only UI-needed fields
   - no unauthenticated list-all-passengers endpoint
7. `convex/sync.ts` (`"use node"`, actions only, viem):
   - `verifyMint` internal action — fetches the receipt, decodes `BoardingPassMinted`, reads
     `getBoardingPass(tokenId)` from the contract, then calls an internal mutation to upsert the
     verified `mints` row and update `seatIndex`
   - `reconcile` internal action — reads `syncState`, computes a safe confirmed head (head minus a
     confirmation buffer), requests `BoardingPassMinted` logs in bounded block ranges from the
     deployment start block, upserts idempotently, advances the cursor
   - RPC URL comes from a Convex **server** environment variable, never a public Nuxt var
8. `convex/crons.ts` — `reconcile` every 5 minutes. Not every second.
9. Idempotency: all upserts key on `chainId + contractAddress + tokenId`. Running `reconcile`
   twice over the same range must produce zero duplicate rows — assert this in a test.
10. `docs/data-authority.md` — Ethereum is authoritative for seat existence, ownership, fare math,
    payment, passenger record, manifest, metadata. Convex holds drafts, cache, analytics, history,
    sync cursor. On conflict, Ethereum wins.

## Verification

```bash
pnpm convex:dev        # deploys functions to the dev deployment
pnpm typecheck
pnpm test
npx convex run seats:seedSeatIndex
npx convex data seatIndex   # expect 184 rows
```

Run `reconcile` twice against a known range and confirm the row count does not change.

## Done criteria

- Schema deployed; 184 seat rows seeded.
- Every public function has `args` and `returns`; no `.filter()` on a table scan where an index
  exists; every promise awaited.
- No client-submitted field can mark a seat owned without chain verification.
- Duplicate ingestion is provably impossible.

## Commit

`feat(convex): booking drafts, seat index, verified mint index, and reconciliation`
