# Plan 07 — BoardingPassRenderer, fully onchain SVG and metadata

## Goal

A separate renderer that turns BoardingPass state into a `data:application/json;base64` tokenURI
containing a `data:image/svg+xml;base64` boarding pass. No IPFS, no API, no image host.

## Prerequisites

Plan 06 done.

## Tasks

1. `contracts/src/libraries/SvgEscape.sol` — escape `&`, `<`, `>`, `"`, `'` in that order
   (ampersand first), and drop or replace control characters. `internal pure`, gas-aware
   single-pass implementation over `bytes`.
2. `contracts/src/libraries/JsonEscape.sol` — escape `\`, `"`, and control chars as `\u00XX`;
   never emit a raw newline or tab inside a JSON string.
3. `contracts/src/BoardingPassRenderer.sol`:
   - immutable `IBoardingPass` reference; reads canonical data, duplicates nothing
   - `tokenURI(uint256) → string` = `data:application/json;base64,` + Base64 of the metadata JSON
   - `craftSvg(uint256) → string` exposed as a public view for the frontend and for tests
   - all user strings pass through `SvgEscape` for SVG and `JsonEscape` for JSON
4. SVG: 1200 × 600 landscape, original airline identity, structured as
   - main panel: `ETHEREUM AIRWAYS` / `BOARDING PASS` lockup, `PASSENGER` name in large caps,
     `CURRENT LOCATION → ETHEREUM` as the dominant route line
   - detail grid: `FLIGHT ETH001`, `WHEN NOW`, `TRIP ROUND TRIP`, `SEAT`, `SEAT TYPE`, `BAGS`,
     `DATE OF BIRTH`, `BIRTHDAY`, `X @handle`
   - perforated divider with notch motif; stub carries `SEAT` oversized, token id, shortened
     traveler address, `VESSEL CRAFT #X` / `ENTRY #Y`
   - destination and seat readable at thumbnail scale
   - deterministic pattern block from `keccak256(abi.encode(tokenId, traveler, vesselCraftId,
     vesselEntry))`, bits mapped to cells. Never call it a QR code.
   - fonts: generic families only (no external font fetch)
5. Metadata JSON: `name` (`Boarding Pass · Seat 12A`), `description` stating this is an onchain
   boarding pass to Ethereum and that passenger data is permanently public, `image` data URI, and
   attributes: Destination, Origin, Trip, Flight, Seat, Seat Type, Cabin, Bags, Passenger,
   Date of Birth, Birthday, X, Vessel Craft, Vessel Entry.
6. Renderer tests `contracts/test/BoardingPassRenderer.t.sol`:
   - `tokenURI` reverts for an unminted token
   - Base64 decodes; JSON parses via `vm.parseJson`
   - image decodes; SVG is well-formed and contains passenger, destination, seat, seat type, bags,
     DOB, birthday, craft, entry
   - adversarial inputs: `<script>alert(1)</script>`, `A&B`, `" onclick="alert(1)`,
     `back\slash"quote`, a 48-byte multibyte name — assert no raw `<`/`>` from user input survives
     and the JSON still parses
   - determinism: same state renders byte-identical output twice; different tokens differ
   - a hash snapshot test for one fixed boarding pass
7. Wire `BoardingPass.setRenderer` in the deploy scripts (plan 14); never auto-freeze.

## Verification

```bash
cd contracts
forge fmt --check
forge build
forge test --match-path "test/BoardingPassRenderer.t.sol" -vvv
```

Also dump one SVG to `contracts/out/sample-pass.svg` via a test helper and open it to review the
design visually before accepting this plan.

## Done criteria

- tokenURI is 100% onchain with no external references.
- Every adversarial string is inert in both SVG and JSON.
- Rendered sample reviewed and approved as a credible airline boarding pass, not an NFT card.
- Snapshot hash test locked in.

## Commit

`feat(contracts): fully onchain boarding pass renderer with escaped user data`
