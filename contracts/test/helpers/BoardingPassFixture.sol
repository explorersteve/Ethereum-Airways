// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VesselFixture} from "./VesselFixture.sol";
import {BoardingPass} from "../../src/BoardingPass.sol";
import {SeatLib} from "../../src/libraries/SeatLib.sol";

/// @dev Shared BoardingPass + MockVessel deploy used by unit, fuzz, and invariant tests.
abstract contract BoardingPassFixture is VesselFixture {
    uint16 internal constant SEAT_12A = 121;
    uint32 internal constant DOB = 19980512;

    BoardingPass internal pass;
    address internal owner;
    address internal treasury;
    address internal traveler;

    function setUp() public virtual override {
        super.setUp();
        owner = makeAddr("owner");
        treasury = makeAddr("treasury");
        traveler = makeAddr("traveler");
        vm.deal(traveler, 10_000 ether);

        // MANIFEST_CRAFT_ID is 6669, which fits uint16.
        // forge-lint: disable-next-line(unsafe-typecast)
        pass = new BoardingPass(address(vessel), uint16(MANIFEST_CRAFT_ID), treasury, owner);
        vm.prank(craftOwner);
        vessel.setDelegate(MANIFEST_CRAFT_ID, address(pass));
    }

    function _nthValidSeat(uint256 n) internal pure returns (uint16) {
        uint256 want = n % 184;
        uint256 seen;
        for (uint16 seatId = 0; seatId < 1000; seatId++) {
            if (!SeatLib.exists(seatId)) continue;
            if (seen == want) return seatId;
            seen++;
        }
        revert("no valid seat");
    }

    function _repeat(string memory ch, uint256 n) internal pure returns (string memory) {
        bytes memory one = bytes(ch);
        bytes memory out = new bytes(n);
        for (uint256 i = 0; i < n; i++) {
            out[i] = one[0];
        }
        return string(out);
    }

    function _hasControlChar(string memory s) internal pure returns (bool) {
        bytes memory raw = bytes(s);
        for (uint256 i = 0; i < raw.length; i++) {
            uint8 c = uint8(raw[i]);
            if (c < 0x20 || c == 0x7f) return true;
        }
        return false;
    }

    function _clip(bytes memory raw, uint256 maxLen) internal pure returns (bytes memory) {
        if (raw.length <= maxLen) return raw;
        bytes memory out = new bytes(maxLen);
        for (uint256 i = 0; i < maxLen; i++) {
            out[i] = raw[i];
        }
        return out;
    }

    function _samplePayload(uint256 expectedEntry, uint16 seatId, address buyer, uint16 bags)
        internal
        view
        returns (bytes memory)
    {
        return abi.encode(
            pass.MANIFEST_MAGIC(),
            pass.MANIFEST_VERSION(),
            address(pass),
            expectedEntry,
            seatId,
            buyer,
            "Ada Lovelace",
            DOB,
            "ada",
            bags,
            pass.quote(seatId, bags),
            block.timestamp,
            pass.ORIGIN(),
            pass.DESTINATION(),
            pass.TRIP(),
            pass.DEPARTURE(),
            pass.FLIGHT()
        );
    }
}
