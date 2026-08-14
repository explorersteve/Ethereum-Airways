# Plan 05 — IVESSEL interface and MockVessel

## Goal

Vendor the minimum real Vessel interface and build a mock that reproduces production Vault
semantics exactly, so atomicity can be tested locally.

## Prerequisites

Plan 04 done.

## Verified production facts

- Official interface: `IVESSEL.sol` from `producedbydav/The-Vessel`, `pragma ^0.8.20`.
- Mainnet `0xECb92Cc7112b80A2234936315BbB493fb48d1463`; Sepolia
  `0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC` (same interface, verified live).
- Byte capacity per payload write = craft token ID. Sepolia craft 6675 → 6675 bytes; mainnet craft
  6669 → 6669 bytes.
- Vault write path: `setPayloadHolder(tokenId, bytes)` appends and increments `craftToEntry`.
- Capsule write path replaces the single payload — a Capsule must never be used as the manifest.
- Craft type is deterministic per token ID but **seeded differently per chain**.

## Tasks

1. `contracts/src/interfaces/IVessel.sol` — vendor only the surface we call, matching the official
   signatures byte for byte:
   ```solidity
   function craftToVaultStatus(uint256) external view returns (bool);
   function craftToLocked(uint256) external view returns (bool);
   function craftToDelegate(uint256) external view returns (address);
   function craftToEntry(uint256) external view returns (uint256);
   function craftToClaimed(uint256) external view returns (bool);
   function ownerOf(uint256) external view returns (address);
   function setPayloadHolder(uint256 _tokenId, bytes calldata _bytes) external;
   function setDelegate(uint256 _tokenId, address _delegate) external;
   function vaultToEntry(uint256 _tokenId, uint256 _entry) external view returns (bytes memory);
   ```
   Add a header comment linking the upstream file and noting that nothing here may be invented.
2. `contracts/src/mocks/MockVessel.sol` implementing that interface with production semantics:
   - `claim`-like test setter to mark a craft claimed/owned and set its type
   - `setPayloadHolder` requires caller is owner **or** delegate, requires vault status true,
     requires not locked, requires `bytes.length <= tokenId`, appends to a per-craft array, and
     increments `craftToEntry`
   - Capsule mode replaces slot 0 and does **not** increment the entry counter
   - `setDelegate` restricted to owner
   - test-only knobs: `setLocked`, `setVaultStatus`, `forceWriteFailure(bool)` that reverts on the
     next `setPayloadHolder`, and `payloadAt(craftId, entry)` for byte comparison
   - mock reverts must be distinguishable from BoardingPass reverts
3. `contracts/test/MockVessel.t.sol` — prove the mock itself matches the documented rules:
   payload exactly at capacity succeeds, capacity + 1 reverts, non-delegate reverts, locked
   reverts, non-vault reverts, Vault appends increment the counter, Capsule replace does not,
   `vaultToEntry` returns the exact bytes written.
4. `contracts/test/helpers/VesselFixture.sol` — shared setup deploying MockVessel with a
   6669-capacity Vault craft at entry 0, mirroring the real crafts (mainnet 6669, Sepolia 6675).
   Use the smaller capacity so tests bind against the tighter of the two chains. Include a second
   fixture craft with a deliberately small capacity to exercise `VesselPayloadTooLarge`, and one
   with a non-zero starting entry to prove the contract never assumes the counter starts at 0.

## Verification

```bash
cd contracts
forge fmt --check
forge build
forge test --match-path "test/MockVessel.t.sol" -vv
```

## Done criteria

- Vendored interface signatures match the upstream file exactly; nothing invented.
- Mock enforces `payload.length <= craftId` and Vault-vs-Capsule entry semantics.
- Fixture reproduces the real craft shape (Vault, unlocked, entry 0, capacity 6669) plus a
  small-capacity craft and a non-zero-entry craft.

## Commit

`feat(contracts): vendor IVessel surface and add production-faithful MockVessel`

## Plan log

- Executed 2026-08-13.
- Vendored `IVessel` as a signature-accurate subset of official `Core Contracts/IVESSEL.sol`.
- MockVessel: Vault append increments `craftToEntry`; Capsule replaces slot 0; capacity
  `payload.length <= tokenId`; `MockVessel*` errors; sticky `forceWriteFailure`.
- Fixture: Vault 6669 unlocked entry 0; small craft 64; Sepolia-id 6675 starting at entry 7.
- `forge fmt --check`, `forge build` (no warnings), `forge test --match-path test/MockVessel.t.sol -vv` 14/14.
