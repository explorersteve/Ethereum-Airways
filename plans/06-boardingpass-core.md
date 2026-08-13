# Plan 06 — BoardingPass core contract

## Goal

The single payable entry point that atomically charges the exact fare, reserves the seat, writes
the Vessel manifest entry, and mints the boarding pass.

## Prerequisites

Plans 04 and 05 done. `contracts/SECURITY-CHECKLIST.md` in hand.

## Contract shape

```solidity
contract BoardingPass is ERC721, Ownable2Step, Pausable, ReentrancyGuard
```

Name `Ethereum Boarding Pass`, symbol `ETHAIR`. Non-upgradeable. OpenZeppelin 5 constructor forms
(`Ownable(initialOwner)`).

## Tasks

1. Constants: `BASE_FARE = 0.001 ether`, `BAG_PRICE = 0.01 ether`, flight strings
   (`Current Location`, `Ethereum`, `Round Trip`, `Now`, `ETH001`), `MANIFEST_MAGIC` (`bytes4`),
   `MANIFEST_VERSION = 1`, `MAX_NAME_BYTES = 48`, `MAX_HANDLE_BYTES = 32`.
2. Immutable `IVessel public immutable VESSEL` set in the constructor. Mutable `vesselCraftId`,
   `renderer`, `rendererFrozen`, `treasury`.
3. Storage: `mapping(uint256 => BoardingPassData) private _passes`. Use the brief's struct but
   verify every width against real maxima; where a cast is not provably safe, widen the field
   rather than adding an unchecked cast. Store `mintedAt` because the Vessel payload embeds
   `block.timestamp` and must be reproducible.
4. Pure reads delegating to `SeatLib`: `seatExists`, `seatLabel`, `seatPrice`, `quote(seatId,
   bagCount)`. `quote` = `BASE_FARE + seatPrice(seatId) + BAG_PRICE * bagCount`; `bagCount` is
   `uint16` so the multiplication cannot overflow `uint256`.
5. View reads: `isSeatAvailable(uint16)` (`exists && _ownerOf(seatId) == address(0)`),
   `getSeatAvailability(uint16[] calldata) → bool[]` sized for one 184-element `eth_call`,
   `getBoardingPass(uint256) → BoardingPassData` (reverts if token does not exist),
   `vesselPayloadFor(uint256) → bytes` reproducing the original bytes exactly.
6. `bookAndMint(uint16 seatId, string calldata fullName, uint32 dateOfBirth,
   string calldata twitterHandle, uint16 bagCount) external payable nonReentrant whenNotPaused`,
   in this order:
   1. `SeatLib.exists` else `InvalidSeat`
   2. `_ownerOf(seatId) == address(0)` else `SeatAlreadyClaimed`
   3. name 1–48 bytes, no control chars, else `InvalidName`
   4. `DateLib.isValid(dateOfBirth)` else `InvalidDateOfBirth`
   5. handle <= 32 bytes, no leading `@`, no control chars, else `InvalidTwitterHandle`
   6. `expected = quote(...)`; `msg.value != expected` → `IncorrectPayment(expected, msg.value)`
      (rejects over- and underpayment)
   7. Vessel readiness: `craftToVaultStatus == true` else `VesselCraftNotVault`;
      `craftToLocked == false` else `VesselCraftLocked`;
      `craftToDelegate == address(this)` else `VesselDelegateMismatch`
   8. `expectedEntry = craftToEntry(craftId) + 1`
   9. build payload; `payload.length > craftId` → `VesselPayloadTooLarge(length, craftId)`
   10. `VESSEL.setPayloadHolder(craftId, payload)` — plain external call, never low-level, never
       try/catch. A Vessel revert must bubble up and revert the whole booking.
   11. verify `craftToEntry(craftId) == expectedEntry` else `VesselEntryMismatch`
   12. store `BoardingPassData` (traveler = `msg.sender`, `mintedAt = block.timestamp`,
       `totalPaid = msg.value`, craft id, entry)
   13. `_safeMint(msg.sender, seatId)`
   14. `emit BoardingPassMinted(...)`
   Rationale comment: `nonReentrant` guards the entry point; VESSEL is immutable trusted
   infrastructure; `_safeMint` is last so the ERC-721 receiver callback observes fully written
   state and cannot re-enter booking.
7. Payload builder `_buildManifest(...) internal view returns (bytes memory)` using
   `abi.encode(MANIFEST_MAGIC, MANIFEST_VERSION, address(this), expectedEntry, seatId,
   msg.sender, fullName, dateOfBirth, twitterHandle, bagCount, totalPaid, timestamp, ORIGIN,
   DESTINATION, TRIP, DEPARTURE, FLIGHT)`. Freeze the tuple order; document it in the README and in
   a decoder test. `vesselPayloadFor` calls the same builder with stored values.
8. Owner controls, each emitting an event:
   - `setRenderer(address)` — reverts `RendererIsFrozen` once frozen
   - `freezeRenderer()` — one-way
   - `setVesselCraftId(uint16) external onlyOwner whenPaused` — re-verifies vault status, lock, and
     delegate before accepting; emits `VesselCraftUpdated`
   - `setTreasury(address)`, `withdraw() external onlyOwner nonReentrant` using `.call` with a
     checked return and a zero-balance guard
   - `pause()` / `unpause()` — booking only; transfers, `tokenURI`, and ownership reads stay live
9. `tokenURI(uint256)` requires the token exists and delegates to the renderer; if renderer is
   unset, revert `RendererUnset`.
10. Custom errors exactly as brief §80, plus `VesselEntryMismatch`, `RendererUnset`,
    `NothingToWithdraw`, `TransferFailed`.
11. `contracts/src/interfaces/IBoardingPass.sol` exposing the struct and reads the renderer needs.

## Verification

```bash
cd contracts
forge fmt --check
forge build
forge test -vv
```

Smoke tests written in this plan (the full suite is plan 08): happy path mint, exact payment
enforcement, duplicate seat rejection, one Vessel-failure rollback case.

## Done criteria

- One transaction performs payment + seat reservation + Vessel append + mint.
- No `try/catch`, no low-level call around the Vessel write.
- `tokenId == seatId` for every mint; no counter.
- Pausing blocks `bookAndMint` and nothing else.
- Every documented custom error is reachable by a test.

## Commit

`feat(contracts): BoardingPass ERC-721 with atomic vessel manifest write`
