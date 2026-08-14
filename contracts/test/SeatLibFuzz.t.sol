// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {SeatLib} from "../src/libraries/SeatLib.sol";

contract SeatLibFuzzTest is Test {
    function testFuzz_InvalidSeatsRevertAndValidSeatsDoNot(uint16 seatId) public {
        if (!SeatLib.exists(seatId)) {
            vm.expectRevert(abi.encodeWithSelector(SeatLib.InvalidSeat.selector, seatId));
            this.priceExternal(seatId);
            vm.expectRevert(abi.encodeWithSelector(SeatLib.InvalidSeat.selector, seatId));
            this.labelExternal(seatId);
            vm.expectRevert(abi.encodeWithSelector(SeatLib.InvalidSeat.selector, seatId));
            this.cabinExternal(seatId);
            vm.expectRevert(abi.encodeWithSelector(SeatLib.InvalidSeat.selector, seatId));
            this.positionExternal(seatId);
            return;
        }

        SeatLib.price(seatId);
        SeatLib.label(seatId);
        SeatLib.cabin(seatId);
        SeatLib.position(seatId);
        SeatLib.priorityLabel(seatId);
    }

    function test_PriceHierarchyOverAllSeats() public pure {
        uint256 minFirst = type(uint256).max;
        uint256 maxComfort;
        uint256 maxExit;
        uint256 maxMainWA;
        uint256 maxMainMid;
        uint256 maxRearWA;

        for (uint16 seatId = 0; seatId < 1000; seatId++) {
            if (!SeatLib.exists(seatId)) continue;
            uint256 p = SeatLib.price(seatId);
            SeatLib.Cabin c = SeatLib.cabin(seatId);
            SeatLib.SeatPosition pos = SeatLib.position(seatId);

            if (c == SeatLib.Cabin.First) {
                if (p < minFirst) minFirst = p;
            } else if (c == SeatLib.Cabin.Comfort) {
                if (p > maxComfort) maxComfort = p;
            } else if (c == SeatLib.Cabin.Exit) {
                if (p > maxExit) maxExit = p;
            } else if (c == SeatLib.Cabin.Main) {
                if (pos == SeatLib.SeatPosition.Middle) {
                    if (p > maxMainMid) maxMainMid = p;
                } else if (p > maxMainWA) {
                    maxMainWA = p;
                }
            } else if (pos != SeatLib.SeatPosition.Middle) {
                if (p > maxRearWA) maxRearWA = p;
            }
        }

        assertGt(minFirst, maxComfort);
        assertGt(maxComfort, maxExit);
        assertGt(maxExit, maxMainWA);
        assertGt(maxMainWA, maxMainMid);
        assertGt(maxMainMid, maxRearWA);
    }

    function test_MonotonicDecreaseWithinEachCabin() public pure {
        for (uint16 r = 2; r <= 4; r++) {
            assertLt(SeatLib.price(r * 10 + 1), SeatLib.price((r - 1) * 10 + 1));
        }
        for (uint16 r = 6; r <= 9; r++) {
            assertLt(SeatLib.price(r * 10 + 1), SeatLib.price((r - 1) * 10 + 1));
        }
        assertLt(SeatLib.price(111), SeatLib.price(101));
        for (uint16 r = 13; r <= 24; r++) {
            assertLt(SeatLib.price(r * 10 + 1), SeatLib.price((r - 1) * 10 + 1));
            assertLt(SeatLib.price(r * 10 + 2), SeatLib.price((r - 1) * 10 + 2));
        }
        for (uint16 r = 26; r <= 32; r++) {
            assertLt(SeatLib.price(r * 10 + 1), SeatLib.price((r - 1) * 10 + 1));
            assertLt(SeatLib.price(r * 10 + 2), SeatLib.price((r - 1) * 10 + 2));
        }
    }

    function priceExternal(uint16 seatId) external pure returns (uint256) {
        return SeatLib.price(seatId);
    }

    function labelExternal(uint16 seatId) external pure returns (string memory) {
        return SeatLib.label(seatId);
    }

    function cabinExternal(uint16 seatId) external pure returns (SeatLib.Cabin) {
        return SeatLib.cabin(seatId);
    }

    function positionExternal(uint16 seatId) external pure returns (SeatLib.SeatPosition) {
        return SeatLib.position(seatId);
    }
}
