# Plan 08 — Contract test suite: unit, fuzz, invariant, fork

## Goal

Prove correctness and atomicity of the whole contract system, including against the real Sepolia
and mainnet Vessel deployments.

## Prerequisites

Plans 06 and 07 done.

## Tasks

1. `contracts/test/BoardingPass.t.sol` — unit:
   - happy path: exact `msg.value`, `ownerOf(121) == buyer`, stored data matches inputs,
     Vessel entry advanced by 1, contract balance increased by exactly the quote
   - `tokenId == seatId` for a sample across all five cabins
   - invalid seat, already-claimed seat, empty name, 49-byte name, control-char name,
     33-byte handle, `@`-prefixed handle, invalid DOB (`19980229`), `quote - 1`, `quote + 1`
   - paused blocks booking; transfers and `tokenURI` still work while paused
   - transfer does not alter the stored traveler record; renderer still shows original passenger
   - `withdraw` sends the full balance to treasury, reverts for non-owner, reverts on zero balance
   - `setRenderer` after `freezeRenderer` reverts; `setVesselCraftId` reverts while unpaused and
     when the new craft fails vault/lock/delegate checks
2. `contracts/test/BoardingPassPricing.t.sol` — every §83 price through the contract, plus
   `quote` arithmetic across bag counts including `type(uint16).max`.
3. `contracts/test/BoardingPassFuzz.t.sol`:
   - fuzz `uint16 seatId`: invalid → `InvalidSeat`, valid → succeeds with correct quote
   - fuzz `(seatId, bagCount)`: `quote == BASE_FARE + seatPrice + BAG_PRICE * bagCount`
   - fuzz payment: `value == quote` succeeds; any other value reverts `IncorrectPayment`
   - fuzz strings: bounded random names/handles either revert with the right error or mint and
     round-trip identically through `getBoardingPass`
4. `contracts/test/VesselIntegration.t.sol` — atomicity, one test per failure mode: not a Vault,
   locked craft, delegate revoked, payload larger than capacity, `forceWriteFailure`. After each,
   assert **all** of: seat still available, token does not exist, contract balance unchanged,
   `craftToEntry` unchanged, buyer balance unchanged except gas.
5. `contracts/test/ManifestPayload.t.sol` — `abi.decode` the payload written to MockVessel and
   assert every field; assert `vesselPayloadFor(tokenId)` equals `vaultToEntry(craftId, entry)`
   byte for byte.
6. `contracts/test/Invariants.t.sol` with a handler performing random bookings:
   - a seat can never mint twice
   - for every minted token, `tokenId == stored seatId`
   - `totalPaid == quote(seatId, bagCount)` at mint parameters
   - `vesselCraftId != 0 && vesselEntry != 0`, and entries are strictly increasing with mint count
   - contract balance == sum of all `totalPaid` minus withdrawals
7. `contracts/test/fork/VesselFork.t.sol`, skipped unless the RPC env var is present:
   - Sepolia fork (craft **6675**): read `craftToVaultStatus == true`, `craftToLocked == false`,
     `craftToEntry`, `ownerOf`, and assert capacity 6675 exceeds a real encoded manifest payload
     length
   - mainnet fork (craft **6669**): same reads; assert it is a Vault, unlocked, and owned by the
     operator before it is ever configured
   - a fork-only write test that `vm.prank`s the real craft owner to set the delegate and complete
     one booking. Never use a real private key; `vm.prank` only.
8. `forge coverage` on `src/` excluding mocks; record the numbers in the plan log. Investigate any
   uncovered branch in `BoardingPass.sol`.

## Verification

```bash
cd contracts
forge fmt --check
forge build
forge test -vv
forge test --match-path "test/Invariants.t.sol" -vvv
SEPOLIA_RPC_URL=... forge test --match-path "test/fork/*" -vvv
forge coverage --report summary
slither . || true
```

## Done criteria

- Full suite green with zero skipped non-fork tests.
- Every §87 atomicity assertion passes for all five Vessel failure modes.
- Invariant campaign passes at the configured runs/depth.
- Fork tests confirm Sepolia craft 6675 and mainnet craft 6669 are writable Vaults with capacity
  above the measured payload length. Record that measured length here — plan 14 asserts against it.
- Slither findings triaged; each accepted finding documented in `contracts/SECURITY-CHECKLIST.md`.

## Commit

`test(contracts): unit, fuzz, invariant, and fork coverage for booking and vessel atomicity`

## Plan log

- Executed 2026-08-13.
- Suite files: `BoardingPass.t.sol`, `BoardingPassPricing.t.sol`, `BoardingPassFuzz.t.sol`,
  `VesselIntegration.t.sol`, `ManifestPayload.t.sol`, `Invariants.t.sol`,
  `fork/VesselFork.t.sol`, plus `test/helpers/BoardingPassFixture.sol` and
  `ManifestCodec.sol`.
- Non-fork: **83 tests passed, 0 skipped** (plan 08 files plus existing SeatLib / DateLib /
  MockVessel / renderer tests). Invariants: 128 runs, depth 64, 8192 calls, 0 reverts.
- §87: five Vessel failure modes each leave seat available, token nonexistent,
  contract balance and `craftToEntry` unchanged, buyer balance unchanged (gas price 0).
- Measured Ada Lovelace / 12A manifest payload: **992 bytes**. Binding capacity is
  **6669** bytes (the smaller of mainnet 6669 and Sepolia 6675). Plan 14 should
  assert against this measured 992-byte sample remaining well under 6669.
- Fork (Alchemy RPCs from `.env.local`, never committed): Sepolia 6675 Vault, unlocked,
  entry 0, delegate unset, `ownerOf` reverts (unclaimed). Mainnet 6669 Vault, unlocked,
  entry 0, delegate unset, owner `0xCcf0…118a`. Fork write: `vm.prank` owner
  `setDelegate` + one `bookAndMint`; production `vaultToEntry` is 0-based.
- `forge coverage`: blocked (stack too deep without via_ir; `--ir-minimum` Yul fail).
  Manual `BoardingPass.sol` branch review documented in `SECURITY-CHECKLIST.md`.
- Slither not installed; triaged as skip until plan 15. No accepted Slither findings
  to list yet.
