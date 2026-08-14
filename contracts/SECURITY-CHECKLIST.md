# Security checklist — Ethereum Airways contracts

Recorded from [ethskills security](https://ethskills.com/security/SKILL.md) and
[ethskills testing](https://ethskills.com/testing/SKILL.md) before SeatLib/DateLib
(plan 04), extended in plan 05 for the vendored Vessel surface. Items marked
**later** apply when BoardingPass and the renderer land (plans 06–08). SeatLib
and DateLib are `internal pure` and hold no value. MockVessel is test-only and
must not be deployed as production Vessel.

## Access control

- [x] SeatLib / DateLib: no privileged functions; no storage; no `msg.sender`.
- [x] Admin functions (`setRenderer`, `freezeRenderer`, `setVesselCraftId`,
      `setTreasury`, `withdraw`, `pause`/`unpause`) are `onlyOwner` on
      Ownable2Step. `whenNotPaused` is only on `bookAndMint`. `setVesselCraftId`
      requires `whenPaused`. A single-key pause is a censorship tradeoff — flag
      at QA; treasury/deployer should move to a Safe before mainnet.

## Reentrancy

- [x] SeatLib / DateLib: no external calls.
- [x] `bookAndMint` and `withdraw` use OpenZeppelin `ReentrancyGuard`.
      Vessel write is a typed call on immutable `VESSEL` (no try/catch).
      Pass storage is written before `_safeMint` so a receiver sees complete
      data and cannot re-enter booking.

## External calls

- [x] SeatLib / DateLib: none.
- [x] Vessel `setPayloadHolder` is a typed call on an immutable address.
      Never `delegatecall`. Low-level `call` only in `withdraw` ETH with a
      checked return. No user-supplied call targets.

## Exact payment

- [x] SeatLib `price` is deterministic wei; no `msg.value`.
- [x] `bookAndMint` requires `msg.value == quote(...)`. Rejects over- and
      underpayment with `IncorrectPayment(expected, received)`. No refunds.
      ETH is 18 decimals — do not mix USDC-style 6-decimal assumptions.

## Storage layout

- [x] Libraries are stateless. Contracts are **non-upgradeable** (no proxy,
      no initializer, no storage-gap requirement).
- [x] `BoardingPassData` widens `mintedAt`, `totalPaid`, craft id, and entry
      to `uint256` so payload replay never downcasts `block.timestamp`,
      `msg.value`, or `craftToEntry`. Non-upgradeable (no proxy).

## Input validation

- [x] SeatLib: non-existent seats revert `InvalidSeat(uint16)` on `cabin`,
      `position`, `label`, `priorityLabel`, and `price`. `exists` returns
      false; never a silent zero price.
- [x] DateLib: `isValid` rejects month 0/13, day 0, overflow days, and
      non-leap Feb 29. `monthName` reverts `InvalidMonth` outside 1–12.
- [x] Name 1–48 bytes, handle ≤32, no control chars, no leading `@` on
      handle. Zero-address treasury rejected. Vessel vault/lock/delegate
      checked before every booking. Bag count is `uint16` (mul cannot overflow).

## ERC-721 behavior

- [x] N/A for libraries.
- [x] `tokenId == seatId`. Mint only after payment + Vessel write.
      `_ownerOf(seatId) == address(0)` before mint. Do not re-test OpenZeppelin
      internals; test identity, occupancy, and receiver reentrancy (plan 08).

## Metadata safety

- [x] N/A for libraries (labels are fixed ASCII).
- [x] Unset renderer reverts `RendererUnset`. Freeze is one-way.
- [ ] **Later:** renderer must escape user strings in SVG/`tokenURI` JSON.
      Fully onchain `data:` URI; no IPFS.

## Casts

- [x] Seat row/col from `uint16` division/modulo; no narrowing that can wrap
      a valid seat into another. Prices stay `uint256` wei.
- [x] No unchecked downcast of `block.timestamp`, paid wei, or Vessel entry.

## Deployment safety

- [x] Libraries have no constructor arguments and no selfdestruct.
- [x] Constructor sets Vessel (immutable), owner, treasury, craft id, and
      verifies Vault + unlocked. Delegate is set after deploy (chicken-egg).
      Verify source on the explorer at launch. Never commit deployer keys.
      Use `forge` + `npx convex dev` locally; `forge script` production deploy
      only in plan 14/15.

## Fuzz / invariant expectations

- [x] Exhaustive `uint16` 0–999: `exists` matches an independent row/col rule
      and valid count is exactly 184.
- [x] Fuzz: invalid seats revert `InvalidSeat` on price/label/cabin/position;
      valid seats never revert those getters.
- [x] Price hierarchy: min First > max Comfort > max Exit > max Main W/A >
      max Main middle > max Rear W/A, plus per-cabin row monotonic decrease.
- [x] Smoke: `quote == BASE_FARE + seatPrice + BAG_PRICE * bagCount` for
      sample seats; `totalPaid == quote` on happy-path mint.
- [ ] **Later:** occupancy invariant; fuzz all seats; fork-test real Vessel
      on Sepolia (plan 08).

## Vessel external-call assumptions

- [x] `IVessel` is a signature-accurate subset of official `IVESSEL.sol`
      (https://github.com/producedbydav/The-Vessel/blob/main/Core%20Contracts/IVESSEL.sol).
      No invented methods. Mainnet `0xECb92Cc7112b80A2234936315BbB493fb48d1463`,
      Sepolia `0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC`.
- [x] MockVessel reproduces Vault append + entry increment, Capsule slot-0
      replace without increment, `payload.length <= tokenId`, owner-or-delegate
      writes, owner-only `setDelegate`, and lock. Mock errors are `MockVessel*`
      so they cannot be mistaken for BoardingPass errors. `forceWriteFailure`
      is a sticky test knob (a reverted write cannot disarm it).
- [x] Vessel is trusted infrastructure at a known address, not a
      user-supplied token. `setPayloadHolder` reverts bubble. After the call,
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
