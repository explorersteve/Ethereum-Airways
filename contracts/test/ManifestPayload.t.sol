// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BoardingPassFixture} from "./helpers/BoardingPassFixture.sol";
import {ManifestDecoder, ManifestV1} from "./helpers/ManifestCodec.sol";

contract ManifestPayloadTest is BoardingPassFixture {
    function test_ManifestAbiDecodeAndByteEquality() public {
        uint16 bags = 2;
        uint256 price = pass.quote(SEAT_12A, bags);
        uint256 t0 = 1_800_000_000;
        vm.warp(t0);

        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", bags);

        bytes memory payload = vessel.vaultToEntry(MANIFEST_CRAFT_ID, 1);
        ManifestV1 memory m = new ManifestDecoder().decode(payload);

        assertEq(m.magic, pass.MANIFEST_MAGIC());
        assertEq(m.version, pass.MANIFEST_VERSION());
        assertEq(m.issuer, address(pass));
        assertEq(m.expectedEntry, 1);
        assertEq(m.seatId, SEAT_12A);
        assertEq(m.traveler, traveler);
        assertEq(m.fullName, "Ada Lovelace");
        assertEq(m.dateOfBirth, DOB);
        assertEq(m.twitterHandle, "ada");
        assertEq(m.bagCount, bags);
        assertEq(m.totalPaid, price);
        assertEq(m.timestamp, t0);
        assertEq(m.origin, "Current Location");
        assertEq(m.destination, "Ethereum");
        assertEq(m.trip, "Round Trip");
        assertEq(m.departure, "Now");
        assertEq(m.flight, "ETH001");

        bytes memory rebuilt = pass.vesselPayloadFor(SEAT_12A);
        assertEq(rebuilt, payload);
        assertEq(rebuilt, vessel.vaultToEntry(MANIFEST_CRAFT_ID, 1));

        // Recorded for plan 14: this sample is representative of a typical Ada Lovelace mint.
        emit log_named_uint("manifest payload bytes (Ada, 12A, 2 bags)", payload.length);
        assertLt(payload.length, MANIFEST_CRAFT_ID);
        assertLt(payload.length, 6675);
    }
}
