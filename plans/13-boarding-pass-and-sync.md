# Plan 13 — Boarding pass page and chain sync

## Goal

Close the loop: decode the receipt, index the mint reliably even if the browser closes, and render
the onchain boarding pass from a direct URL.

## Prerequisites

Plan 12 done.

## Tasks

1. `app/lib/evm/receipt.ts` — decode `BoardingPassMinted` from the receipt logs with viem, filtered
   by the contract address; extract tokenId, seatId, totalPaid, bagCount, vesselCraftId,
   vesselEntry. Handle the "log not found" case explicitly instead of assuming index 0.
2. On confirmation: update booking state, call Convex `recordMint` (txHash + tokenId only, the
   server verifies), then navigate `/boarding-pass/[tokenId]`.
   If the Convex write fails, **do not** report a failed booking — the chain is authoritative; show
   an unobtrusive "finalizing your record" note and let reconciliation backfill.
3. `app/pages/boarding-pass/[tokenId].vue`:
   - works from a cold direct URL with no prior booking state
   - reads `tokenURI(tokenId)` from the contract, decodes the base64 JSON, renders the `image` data
     URI at large size. A small `app/components/airline/OnchainArtifact.vue` handles the decode;
     use `EvmArtifact` only if inspection of the installed component shows it handles a raw onchain
     data URI cleanly.
   - `Welcome aboard.` headline; trip `Current Location → Ethereum`; seat label + priority label;
     `Vessel Craft #X` / `Entry #Y`; shortened tx hash
   - actions: View Transaction, View NFT, View Vessel, Copy Boarding Pass Link — all built from the
     configured block explorer for the active chain, never hardcoded
   - contract read is the primary source; Convex is used only to enrich (e.g. tx hash) and may be
     absent
   - states: token does not exist (clear message, not a crash), RPC failure (retry), pending
     indexing (chain data already shown)
4. Optional `/my-trips` — list mints for the connected wallet via `listMintsByOwner`, each linking
   to its boarding pass. Keep it small; skip if it grows.
5. Reconciliation hardening (Convex side from plan 09):
   - confirm the browser fast path and the cron path converge on a single row for the same token
   - deployment start block comes from `deployments/<network>.json`, never a genesis scan
   - bounded log ranges with retry, and a test that re-running the same range creates no duplicates
6. Test with the browser closed immediately after submitting: the mint must still appear in Convex
   after the next cron cycle, and the boarding pass page must already work from chain data alone.
7. Tests: receipt decoding from a fixture log set; boarding pass page renders from a mocked
   `tokenURI`; explorer links resolve per chain; missing-token state.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm dev
npx convex logs
```

Anvil run: complete a booking, hard-close the tab at the wallet confirmation, reopen at
`/boarding-pass/<id>` and confirm the pass renders and the Convex row appears after reconciliation.

## Done criteria

- Boarding pass renders from a direct URL with an empty booking state.
- SVG comes from `tokenURI`, fully onchain.
- Convex row exists exactly once whether the fast path, the cron, or both ran.
- A failed Convex write never surfaces as a failed booking.

## Commit

`feat: onchain boarding pass page and reliable mint reconciliation`
