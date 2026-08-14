# Security checklist — Ethereum Airways contracts

Recorded from [ethskills security](https://ethskills.com/security/SKILL.md) and
[ethskills testing](https://ethskills.com/testing/SKILL.md) before SeatLib/DateLib
(plan 04). Items marked **later** apply when BoardingPass and the renderer land
(plans 06–08). Libraries in this plan are `internal pure` and hold no value.

## Access control

- [x] SeatLib / DateLib: no privileged functions; no storage; no `msg.sender`.
- [ ] **Later:** every admin function (`setRenderer`, `freezeRenderer`,
      `setVesselCraftId`, `setTreasury`, `withdraw`, `pause`/`unpause`) is
      `onlyOwner`. Prefer Ownable2Step. Pause must not freeze transfers or
      `tokenURI`. A single-key pause is a censorship tradeoff — flag at QA;
      treasury/deployer should move to a Safe before mainnet.

## Reentrancy

- [x] SeatLib / DateLib: no external calls.
- [ ] **Later:** `bookAndMint` and `withdraw` use Checks-Effects-Interactions plus
      OpenZeppelin `ReentrancyGuard`. Mint last so an ERC-721 receiver sees
      fully written pass data. Do not use try/catch around Vessel.

## External calls

- [x] SeatLib / DateLib: none.
- [ ] **Later:** Vessel `setPayloadHolder` is a typed call on an immutable
      address. Never `delegatecall`. Never low-level `call` except `withdraw`
      ETH with a checked return. No user-supplied call targets.

## Exact payment

- [x] SeatLib `price` is deterministic wei; no `msg.value`.
- [ ] **Later:** `bookAndMint` requires `msg.value == quote(...)`. Reject over-
      and underpayment with `IncorrectPayment(expected, received)`. No refunds.
      ETH is 18 decimals — do not mix USDC-style 6-decimal assumptions.

## Storage layout

- [x] Libraries are stateless. Contracts are **non-upgradeable** (no proxy,
      no initializer, no storage-gap requirement).
- [ ] **Later:** keep `BoardingPassData` widths proven against maxima; do not
      silently downcast. No UUPS/Transparent proxy.

## Input validation

- [x] SeatLib: non-existent seats revert `InvalidSeat(uint16)` on `cabin`,
      `position`, `label`, `priorityLabel`, and `price`. `exists` returns
      false; never a silent zero price.
- [x] DateLib: `isValid` rejects month 0/13, day 0, overflow days, and
      non-leap Feb 29. `monthName` reverts `InvalidMonth` outside 1–12.
- [ ] **Later:** name 1–48 bytes, handle ≤32, no control chars, bag count
      bounds, zero-address treasury, Vessel vault/lock/delegate checks.

## ERC-721 behavior

- [x] N/A for libraries.
- [ ] **Later:** `tokenId == seatId`. Mint only after payment + Vessel write.
      `_ownerOf(seatId) == address(0)` before mint. Do not re-test OpenZeppelin
      internals; test identity, occupancy, and receiver reentrancy.

## Metadata safety

- [x] N/A for libraries (labels are fixed ASCII).
- [ ] **Later:** renderer must escape user strings in SVG/`tokenURI` JSON.
      Fully onchain `data:` URI; no IPFS. Unset renderer reverts
      `RendererUnset`. Freeze is one-way.

## Casts

- [x] Seat row/col from `uint16` division/modulo; no narrowing that can wrap
      a valid seat into another. Prices stay `uint256` wei.
- [ ] **Later:** no unchecked downcast of `block.timestamp`, paid wei, or
      Vessel entry into a field that cannot hold the maximum.

## Deployment safety

- [x] Libraries have no constructor arguments and no selfdestruct.
- [ ] **Later:** constructor sets Vessel (immutable), owner, treasury, craft
      id. Verify Vessel vault/delegate onchain before unpausing. Verify source
      on the explorer. Never commit deployer keys. Use `forge` + `npx convex
      dev` locally; `forge script` production deploy only in plan 14/15.

## Fuzz / invariant expectations

- [x] Exhaustive `uint16` 0–999: `exists` matches an independent row/col rule
      and valid count is exactly 184.
- [x] Fuzz: invalid seats revert `InvalidSeat` on price/label/cabin/position;
      valid seats never revert those getters.
- [x] Price hierarchy: min First > max Comfort > max Exit > max Main W/A >
      max Main middle > max Rear W/A, plus per-cabin row monotonic decrease.
- [ ] **Later:** `quote == BASE_FARE + seatPrice + BAG_PRICE * bagCount`;
      `totalPaid == quote` at mint; occupancy invariant; fork-test real Vessel
      on Sepolia.

## Vessel external-call assumptions

- [x] N/A in this plan (no Vessel interface yet).
- [ ] **Later:** Vessel is trusted infrastructure at a known address, not a
      user-supplied token. Assume `setPayloadHolder` can revert (locked,
      capacity, not delegate) and must bubble. After the call,
      `craftToEntry` must equal the expected next entry or revert
      `VesselEntryMismatch`. Payload bytes ≤ craft token id. Vault crafts
      only (append); Capsules are not usable as the manifest. Do not treat
      Vessel as an ERC-20 — no SafeERC20, no decimals, no approvals.

## Integer math (SeatLib)

- [x] Multiply before divide (`wa * 2 / 3`). Truncation of Main middles is
      deliberate and documented in wei in `SeatLib.sol`.
- [x] No floating point. All prices in wei via `ether` literals.

## Not applicable to this product

- Token decimals / SafeERC20 / fee-on-transfer / vault inflation / infinite
  approvals / DEX oracles / MEV sandwich on swaps / EIP-712 permits /
  delegatecall proxies. Payments are native ETH only.
