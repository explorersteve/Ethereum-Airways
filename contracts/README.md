# Ethereum Airways contracts

Foundry workspace for `BoardingPass` (ERC-721 booking + Vessel manifest write) and,
in a later plan, `BoardingPassRenderer`.

## Manifest payload (frozen)

Every Vessel Vault entry is `abi.encode` of this tuple, in this order. Do not reorder,
insert, or change types without bumping `MANIFEST_VERSION`.

| # | Solidity type | Value |
| --- | --- | --- |
| 1 | `bytes4` | `MANIFEST_MAGIC` (`0x45544841`) |
| 2 | `uint8` | `MANIFEST_VERSION` (`1`) |
| 3 | `address` | `BoardingPass` contract (`address(this)`) |
| 4 | `uint256` | expected Vessel entry (`craftToEntry + 1`) |
| 5 | `uint16` | `seatId` |
| 6 | `address` | traveler (`msg.sender` at mint) |
| 7 | `string` | `fullName` |
| 8 | `uint32` | `dateOfBirth` (`yyyymmdd`) |
| 9 | `string` | `twitterHandle` (no leading `@`) |
| 10 | `uint16` | `bagCount` |
| 11 | `uint256` | `totalPaid` (`msg.value`) |
| 12 | `uint256` | `block.timestamp` at mint (stored as `mintedAt`) |
| 13 | `string` | `ORIGIN` (`Current Location`) |
| 14 | `string` | `DESTINATION` (`Ethereum`) |
| 15 | `string` | `TRIP` (`Round Trip`) |
| 16 | `string` | `DEPARTURE` (`Now`) |
| 17 | `string` | `FLIGHT` (`ETH001`) |

`vesselPayloadFor(tokenId)` rebuilds the exact bytes from stored pass data. Decoder
coverage lives in `test/BoardingPass.t.sol` (`test_ManifestPayloadDecodesAndRoundTrips`).

## Commands

```shell
forge fmt --check
forge build
forge test -vv
```

Production deploy uses `forge script` only in plans 14/15. Development uses `forge test`
and a local Anvil node; never `npx convex deploy` for Convex during development.

`foundry.toml` sets `via_ir = true` so the 17-field manifest `abi.encode` compiles
without stack-too-deep.
