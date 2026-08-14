# Data authority

Ethereum Airways treats **Ethereum** as the only ownership and fare authority.
Convex (`diligent-seahorse-531`) is an application cache.

## Ethereum is authoritative for

- seat existence
- seat ownership and NFT ownership
- fare math and payment
- the canonical passenger record on the boarding pass
- Vessel manifest writes
- token metadata (`tokenURI`)

## Convex holds

- guest booking drafts (`bookingSessions`, `passengerDrafts`)
- a fast seat availability cache (`seatIndex`)
- searchable mint history (`mints`)
- the reconciliation cursor (`syncState`)
- analytics and UI convenience

## Conflict rule

If Convex and the chain disagree, **the chain wins**. The browser fast path
(`recordMint`) only stores a pending pointer (`chainId`, `contractAddress`,
`txHash`, `tokenId`) and never passenger data or prices. `verifyMint` and the
five-minute `reconcile` cron read `BoardingPassMinted` and `getBoardingPass`
from RPC (`INDEXER_RPC_URL` / `RPC_URL_<chainId>` Convex env vars — never
`NUXT_PUBLIC_*`) before upserting. Log scans start at
`BOARDING_PASS_START_BLOCK`, copied from `deployments/<network>.json`
`deploymentBlock` — never genesis. Bounded ranges retry on RPC failure.
Upserts are keyed on `chainId + contractAddress + tokenId`, so the browser
fast path and cron converge on one row and running reconciliation twice
cannot create duplicates.

## Nuxt client

`convex-nuxt@0.1.5` auto-imports from `convex-vue`:

- `useConvexQuery`
- `useConvexMutation`
- `useConvexHttpQuery`
- `useConvexClient`

There is no `useConvexAction`. Call actions with `useConvexMutation` or
`useConvexClient()`.
