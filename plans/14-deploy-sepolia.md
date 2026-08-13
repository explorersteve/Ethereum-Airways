# Plan 14 — Local Anvil pipeline and Sepolia deployment

## Goal

A one-command local environment, then a real Sepolia deployment writing to Vessel Vault craft
**6675**.

## Prerequisites

Plan 13 done. Operator inputs resolved: Sepolia craft 6675 claimed by the operator wallet, RPC URLs,
WalletConnect project id, treasury address.

## Manifest crafts

| Chain | Craft | Type | Capacity | Starting entry | Status |
| --- | --- | --- | --- | --- | --- |
| Sepolia | **6675** | Vault, unlocked | 6675 bytes | 0 | claim before deploying |
| Mainnet | **6669** | Vault, claimed, unlocked | 6669 bytes | 0 | owned by `0xCcf0…118a` |

Craft 6669 on Sepolia is a `Capsule` and cannot be used — Capsules overwrite a single payload
instead of appending numbered entries. Craft types are deterministic per ID but seeded differently
per deployment, so the manifest craft ID **necessarily differs per chain** and must stay
configuration, never a Solidity constant. The encoded payload must fit **6669 bytes**, the smaller
of the two capacities.

Both crafts start at entry 0, so Sepolia test passes carry the same entry numbers production will.

## Step 0 — claim the Sepolia craft

From the operator wallet, claim 6675 for `6675 × 1e13 wei` = 0.06675 Sepolia ETH, then verify:

```bash
cast call 0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC "craftToClaimed(uint256)(bool)" 6675 --rpc-url $SEPOLIA_RPC_URL
cast call 0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC "ownerOf(uint256)(address)" 6675 --rpc-url $SEPOLIA_RPC_URL
cast call 0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC "craftToVaultStatus(uint256)(bool)" 6675 --rpc-url $SEPOLIA_RPC_URL
```

Claiming must not change the type — re-assert `Vault` after the claim before deploying. After
BoardingPass is deployed, the craft owner calls `setDelegate(6675, boardingPass)`; until then every
booking reverts `VesselDelegateMismatch`.

## Tasks

1. `contracts/script/DeployLocal.s.sol`:
   - deploy MockVessel; configure craft 6675 as an unlocked Vault owned by the deployer at entry 0,
     mirroring Sepolia
   - deploy BoardingPass with the MockVessel address, craft id 6675, treasury, owner
   - `setDelegate(6675, boardingPass)` on the mock
   - deploy BoardingPassRenderer, then `setRenderer`
   - never freeze the renderer locally
   - write `deployments/anvil.json` with chainId, boardingPass, renderer, vessel, vesselCraftId,
     deploymentBlock
2. `scripts/dev-local.ps1` and `scripts/dev-local.sh`: start Anvil → run `DeployLocal` → write the
   resolved addresses into `.env.local` → `pnpm abi:sync` → start `convex dev` → start `nuxt dev`.
   No manual address copying between runs.
3. Full local E2E: home → search → select → traveler → seat → bag → review → connect Anvil account
   → purchase → boarding pass renders. Verify onchain: exact payment, ERC-721 owner, stored
   passenger data, mock entry counter advanced 0 → 1, payload bytes equal
   `vesselPayloadFor(tokenId)`, tokenURI JSON valid, SVG renders.
4. `contracts/script/DeploySepolia.s.sol` — same order against the real Sepolia Vessel
   `0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC`, craft id from env, treasury from env.
   Deployment must **not** attempt `setDelegate` from the deployer unless the deployer is the craft
   owner; the delegate call is a separate operator step.
5. Pre-deploy verification script `scripts/precheck.ts` (or `cast` commands documented in the
   README) asserting for the target craft: `ownerOf == operator`, `craftToVaultStatus == true`,
   `craftToLocked == false`, and capacity comfortably exceeds a real encoded payload length.
   Record the measured payload length from plan 08 here.
6. Deploy to Sepolia, verify both contracts on Etherscan, then:
   - operator calls `setDelegate(6675, boardingPass)` from `0xCcf0…118a`
   - re-read `craftToDelegate(6675)` and confirm it equals the BoardingPass address
   - record `craftToEntry(6675)` as the pre-launch baseline (expected 0)
7. Write `deployments/sepolia.json`, set `NUXT_PUBLIC_*` values, set the Convex server env vars
   (contract address, chain id, start block, RPC), and confirm reconciliation picks up from the
   deployment block rather than scanning history.
8. Perform one controlled real booking on Sepolia in a cheap rear seat (e.g. 32E at 0.00008 ETH
   seat price) and verify all 13 checks from brief §121 item 13.
9. `README.md` — product, stack, architecture diagram, source-of-truth split, seat model, exact
   pricing formulas, the frozen Vessel payload tuple, local dev commands, Foundry commands,
   deployment process, and the permanent-public-PII warning. Document any place where an ETH skill
   recommendation and the brief were reconciled.

## Verification

```bash
cd contracts && forge test
pnpm build
# local
./scripts/dev-local.ps1
# sepolia
forge script script/DeploySepolia.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
cast call $BOARDING_PASS "isSeatAvailable(uint16)(bool)" 325 --rpc-url $SEPOLIA_RPC_URL
cast call 0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC "craftToDelegate(uint256)(address)" 6675 --rpc-url $SEPOLIA_RPC_URL
```

## Done criteria

- One command brings up Anvil + contracts + Convex + Nuxt with addresses wired automatically.
- Local E2E booking passes every onchain assertion.
- Sepolia contracts deployed and verified; delegate confirmed as BoardingPass.
- One real Sepolia booking passes all 13 post-deploy checks.
- README complete and accurate.

## Commit

`feat: local anvil pipeline, sepolia deployment scripts, and project readme`
