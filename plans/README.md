# Ethereum Airways — Build Plans

Execution index. Plans run **consecutively in numeric order**. Each plan is self-contained:
goal, prerequisites, tasks, verification, done criteria, commit message.

Do not start a plan until the previous plan's "Done criteria" are all green.

## Verified environment (checked 2026-08-13)

| Item | Value |
| --- | --- |
| Node | v22.14.0 |
| pnpm | 10.22.0 |
| Foundry (forge) | 1.7.1 |
| git | 2.49.0 (repo not initialized yet) |
| Repo contents | `ethereum_airline_nuxt_evm_cursor_build_prompt.md`, `.cursor/rules/ethskills.mdc` |

Greenfield: no Nuxt app, no Foundry project, no Convex code exists yet.

## Verified onchain facts

| Item | Value |
| --- | --- |
| Vessel mainnet (chain 1) | `0xECb92Cc7112b80A2234936315BbB493fb48d1463` |
| Vessel Sepolia (chain 11155111) | `0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC` |
| Sepolia Vessel liveness | `MAX_SUPPLY()=10000`, `claimIsActive()=true`, `claimedCount()=122`, `PRICE_PER_UNIT()=1e13` |
| Craft type distribution | Deterministic per token ID, **different seed per chain** (mainnet 8421 = Capsule, Sepolia 8421 = Capsule, mainnet 9973 = Vault, Sepolia 9997 = Vault) |
| **Manifest craft (Sepolia)** | **6675** — `Vault`, unlocked, `craftToEntry = 0`, capacity 6675 bytes/entry, delegate unset. **Not yet claimed** — operator claims it for 0.06675 Sepolia ETH (`6675 × PRICE_PER_UNIT`). |
| **Manifest craft (mainnet)** | **6669** — `Vault`, claimed, unlocked, `craftToEntry = 0`, capacity 6669 bytes/entry, owner `0xCcf0a1307E5e5Ad04E85d94d7f9D400390F0118a`, delegate unset |
| Craft 6669 on Sepolia | `Capsule` (`craftToVaultStatus = false`) — **not usable** as a manifest. Capsules overwrite one payload; Vaults append numbered entries. Craft types are deterministic per ID but seeded differently per deployment, so the manifest craft ID necessarily differs per chain. |
| Binding payload capacity | 6669 bytes (the smaller of the two crafts). The encoded manifest must fit this on both chains. |
| Entry parity | Both crafts start at `craftToEntry = 0`, so Sepolia test entry numbers mirror mainnet. The contract still reads the counter and never assumes a starting value. |
| Vessel byte capacity rule | payload bytes per entry <= craft token ID |

## Architecture decisions (locked)

- **Framework:** Nuxt 4 + Vue 3, pnpm. One app at repo root. No React anywhere.
- **EVM foundation:** `@1001-digital/layers.evm` only. Never extend `layers.base` as well; never install `components`/`components.evm`/`styles` directly.
- **Direct deps allowed:** `viem` and `@wagmi/core`, because app code imports them for reads, simulation, log decoding and Convex sync.
- **Chains:** `mainnet` (1), `sepolia` (11155111) as real product chains; `anvil` (31337) for local dev only. Sepolia is `defaultChain` until mainnet launch. Sepolia is legitimate here because a real Vessel deployment with the same interface exists.
- **Contracts:** two — `BoardingPass.sol` (ERC-721, pricing, seats, Vessel write) and `BoardingPassRenderer.sol` (SVG + tokenURI). Plus libraries, interfaces, mocks. Non-upgradeable, OpenZeppelin 5.
- **Data:** Convex (`diligent-seahorse-531`) for drafts, seat cache, mint index, sync cursor. Ethereum is the only ownership authority. **No** `dapp-query`, **no** `simple-indexer`, **no** IPFS/Arweave metadata stack — tokenURI is a fully onchain `data:` URI.
- **Auth:** none. Guest browsing through review; wallet needed only to purchase. No SIWE.
- **Style:** contemporary trendy airline — deep navy ink, electric blue accent, warm off-white surfaces, tight geometric sans, 10px radii, generous whitespace. Themed via 1001 CSS variables first.

## Plan order

| # | Plan | Depends on |
| --- | --- | --- |
| 00 | [Repo scaffold, Foundry, git](00-preflight-and-scaffold.md) | — |
| 01 | [Nuxt EVM foundation and chain config](01-nuxt-evm-foundation.md) | 00 |
| 02 | [Airline theme tokens and app shell](02-airline-theme-and-shell.md) | 01 |
| 03 | [Domain constants, seat geometry, booking state](03-domain-and-booking-state.md) | 01 |
| 04 | [Solidity SeatLib + pricing](04-solidity-seatlib.md) | 00 |
| 05 | [MockVessel + IVESSEL interface](05-mock-vessel.md) | 04 |
| 06 | [BoardingPass core contract](06-boardingpass-core.md) | 05 |
| 07 | [BoardingPassRenderer + escaping](07-renderer.md) | 06 |
| 08 | [Contract test suite: unit, fuzz, invariant, fork](08-contract-tests.md) | 07 |
| 09 | [Convex schema, drafts, seat index, mints](09-convex-data-layer.md) | 03 |
| 10 | [Airline flow: home, flights, traveler](10-airline-flow-pages.md) | 02, 03, 09 |
| 11 | [Seat map and extras](11-seat-map.md) | 10 |
| 12 | [Contract integration, quote, checkout transaction](12-checkout-integration.md) | 08, 11 |
| 13 | [Boarding pass page + chain sync reconciliation](13-boarding-pass-and-sync.md) | 12 |
| 14 | [Local Anvil E2E + Sepolia deployment](14-deploy-sepolia.md) | 13 |
| 15 | [QA, security review, mainnet launch](15-qa-and-mainnet.md) | 14 |

## Open inputs needed from the operator

Resolved:

- Brand: **Ethereum Airways**, symbol `ETHAIR`.
- Manifest crafts: Sepolia **6675** (to be claimed), mainnet **6669** (owned by `0xCcf0a1307E5e5Ad04E85d94d7f9D400390F0118a`).
- RPC: operator has an Alchemy/Infura key and a WalletConnect project ID.

Still needed, and blocking only from plan 14 onward:

1. Claim Sepolia craft **6675** from the operator wallet (0.06675 Sepolia ETH). Confirm
   `craftToClaimed(6675) == true` and `ownerOf(6675)` is the operator afterwards.
2. The actual Alchemy/Infura RPC URLs and WalletConnect project ID, placed in `.env.local` (never committed).
3. Treasury address for `withdraw()`.
4. Deployer key access for `0xCcf0…118a`, or confirmation that it will call `setDelegate` manually on both chains.

## Commands used throughout

```bash
pnpm install
pnpm dev              # Nuxt dev
pnpm typecheck
pnpm lint
pnpm test             # vitest
pnpm build

pnpm convex:dev       # npx convex dev

cd contracts
forge fmt --check
forge build
forge test
```
