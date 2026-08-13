# Plan 15 — QA, security review, mainnet launch

## Goal

Independent review, full QA sweep, then a controlled mainnet launch.

## Prerequisites

Plan 14 done, with Sepolia running a real booking.

## Tasks

1. **Fresh-agent security audit.** Hand `contracts/` to a separate agent with
   `https://ethskills.com/audit/SKILL.md` and no context from having written the code. Also run
   `https://ethskills.com/qa/SKILL.md` against the app as a separate reviewer. Reviewers report
   PASS/FAIL per item and do not fix. Triage every Medium+ finding before launch.
2. **CROPS review** (`https://ethskills.com/crops/SKILL.md`). Document explicitly: the frontend
   host is a censorship chokepoint; Convex is a centralized index (chain remains authoritative and
   the app degrades to direct reads); passenger name and DOB are permanently public by design;
   owner powers are pause, renderer swap until frozen, craft migration, and withdraw. Name the
   accepted compromises and the user's escape path (direct contract interaction, onchain tokenURI).
3. Manual QA sweep against brief §115: header disconnected/connected/ENS/profile/mobile nav; home
   hero and card focus states; flight card hierarchy and price alignment; traveler validation
   messaging; seat map silhouette, 2-2 and 3-3, wings, exits, aisle, selected, occupied, tooltip,
   sticky summary; bag increment/decrement and large values; review wallet gate, consent,
   wrong-network, CTA; success SVG, explorer links, direct reload.
4. Failure-state sweep (brief §114): RPC down, Convex down, missing contract address, wrong network,
   insufficient ETH, seat claimed mid-flow, user rejection, contract paused, craft not a Vault,
   craft locked, delegate revoked, payload too large, renderer unset, unexpected log shape.
   For each, confirm the app distinguishes "booking failed" from "booked, indexing delayed".
5. Accessibility pass: keyboard-only completion of the entire funnel, visible focus everywhere,
   seat ARIA labels, form label associations, transaction status announcements, and a contrast
   check on all wallet surfaces.
6. Performance: production build, Lighthouse on home and `/seats`, confirm no per-seat network
   calls and no full-map re-render on bag changes.
7. Full command gate:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   cd contracts && forge fmt --check && forge build && forge test
   ```
8. **Mainnet manifest craft: 6669.** Verified state — `Vault`, claimed, unlocked,
   `craftToEntry = 0`, capacity 6669 bytes per entry, owner
   `0xCcf0a1307E5e5Ad04E85d94d7f9D400390F0118a`, delegate unset. Re-verify all four conditions
   immediately before deploying (`ownerOf`, `craftToVaultStatus`, `craftToLocked`, capacity vs the
   measured payload length from plan 08). Note this craft starts at entry 0, so the first mainnet
   booking is entry 1, whereas Sepolia started at 20 — the app must read the counter, never assume.
9. Mainnet deployment in brief §121 order: deploy BoardingPass against
   `0xECb92Cc7112b80A2234936315BbB493fb48d1463` with craft id 6669 → deploy renderer →
   `setRenderer` → craft owner calls `setDelegate` → verify delegate, vault status, lock status →
   read `craftToEntry` → configure Nuxt and Convex (address, chain id, start block) → one
   controlled low-risk booking → verify all 13 post-deploy checks → write
   `deployments/mainnet.json`.
10. Post-launch: set `defaultChain` to `mainnet`, keep Sepolia selectable, transfer ownership to a
    Safe rather than leaving an EOA owner, set up event monitoring, and only consider
    `freezeRenderer()` after the rendered output is final. Do not renounce ownership.
11. Send one line of feedback via `https://ethskills.com/feedback/SKILL.md`.

## Done criteria

- Audit and QA reports attached under `docs/reviews/`; no unresolved Medium+ finding.
- CROPS tradeoffs documented in the README.
- Every command in the gate exits 0.
- Mainnet contracts deployed, verified, delegate confirmed, one booking verified end to end.
- Ownership held by a Safe; renderer not frozen prematurely.
- Every line of brief §145 "Definition of Done" checked off in `docs/definition-of-done.md`.

## Commit

`chore: qa reports, crops review, and mainnet launch configuration`
