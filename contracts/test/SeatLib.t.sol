// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {SeatLib} from "../src/libraries/SeatLib.sol";

contract SeatLibTest is Test {
    function test_ExistenceTableFromBrief() public pure {
        assertTrue(SeatLib.exists(11), "1A");
        assertFalse(SeatLib.exists(12), "1B");
        assertTrue(SeatLib.exists(13), "1C");
        assertTrue(SeatLib.exists(46), "4F");
        assertTrue(SeatLib.exists(52), "5B");
        assertTrue(SeatLib.exists(105), "10E");
        assertTrue(SeatLib.exists(121), "12A");
        assertTrue(SeatLib.exists(326), "32F");
        assertFalse(SeatLib.exists(331), "33A");
        assertFalse(SeatLib.exists(1), "0A");
        assertFalse(SeatLib.exists(0));
    }

    function test_ExhaustiveExistsMatchesIndependentRuleAndCountIs184() public pure {
        uint256 valid;
        for (uint16 seatId = 0; seatId < 1000; seatId++) {
            bool expected = _independentExists(seatId);
            assertEq(SeatLib.exists(seatId), expected);
            if (expected) valid++;
        }
        assertEq(valid, 184);
    }

    function test_BriefSection83PricesExactWei() public pure {
        assertEq(SeatLib.price(11), 0.06 ether); // 1A
        assertEq(SeatLib.price(46), 0.045 ether); // 4F
        assertEq(SeatLib.price(51), 0.03 ether); // 5A
        assertEq(SeatLib.price(95), 0.022 ether); // 9E
        assertEq(SeatLib.price(101), 0.018 ether); // 10A
        assertEq(SeatLib.price(116), 0.016 ether); // 11F
        assertEq(SeatLib.price(121), 0.009 ether); // 12A
        assertEq(SeatLib.price(122), 0.006 ether); // 12B
        assertEq(SeatLib.price(243), 0.003 ether); // 24C
        assertEq(SeatLib.price(245), 0.002 ether); // 24E
        assertEq(SeatLib.price(251), 0.001 ether); // 25A
        assertEq(SeatLib.price(326), 0.00016 ether); // 32F
        assertEq(SeatLib.price(325), 0.00008 ether); // 32E
    }

    function test_MainMiddleTruncationRow13() public pure {
        assertEq(SeatLib.price(132), 5_666_666_666_666_666); // 13B
    }

    function test_PositionMapping() public pure {
        assertEq(uint256(SeatLib.position(121)), uint256(SeatLib.SeatPosition.Window)); // 12A
        assertEq(uint256(SeatLib.position(126)), uint256(SeatLib.SeatPosition.Window)); // 12F
        assertEq(uint256(SeatLib.position(123)), uint256(SeatLib.SeatPosition.Aisle)); // 12C
        assertEq(uint256(SeatLib.position(124)), uint256(SeatLib.SeatPosition.Aisle)); // 12D
        assertEq(uint256(SeatLib.position(122)), uint256(SeatLib.SeatPosition.Middle)); // 12B
        assertEq(uint256(SeatLib.position(125)), uint256(SeatLib.SeatPosition.Middle)); // 12E
    }

    function test_LabelsAcrossCabins() public pure {
        assertEq(SeatLib.label(11), "1A");
        assertEq(SeatLib.label(46), "4F");
        assertEq(SeatLib.label(52), "5B");
        assertEq(SeatLib.label(101), "10A");
        assertEq(SeatLib.label(121), "12A");
        assertEq(SeatLib.label(184), "18D");
        assertEq(SeatLib.label(326), "32F");
    }

    function test_PriorityLabelsAcrossCabins() public pure {
        assertEq(SeatLib.priorityLabel(11), "First Class");
        assertEq(SeatLib.priorityLabel(51), "Comfort");
        assertEq(SeatLib.priorityLabel(101), "Emergency Exit Row");
        assertEq(SeatLib.priorityLabel(121), "Window");
        assertEq(SeatLib.priorityLabel(122), "Middle");
        assertEq(SeatLib.priorityLabel(123), "Aisle");
        assertEq(SeatLib.priorityLabel(321), "Rear Window");
        assertEq(SeatLib.priorityLabel(322), "Rear Middle");
        assertEq(SeatLib.priorityLabel(323), "Rear Aisle");
    }

    function test_CabinsByRow() public pure {
        assertEq(uint256(SeatLib.cabin(11)), uint256(SeatLib.Cabin.First));
        assertEq(uint256(SeatLib.cabin(51)), uint256(SeatLib.Cabin.Comfort));
        assertEq(uint256(SeatLib.cabin(101)), uint256(SeatLib.Cabin.Exit));
        assertEq(uint256(SeatLib.cabin(121)), uint256(SeatLib.Cabin.Main));
        assertEq(uint256(SeatLib.cabin(251)), uint256(SeatLib.Cabin.Rear));
    }

    function test_RevertWhen_InvalidSeatOnGetters() public {
        uint16 missing = 12; // 1B
        vm.expectRevert(abi.encodeWithSelector(SeatLib.InvalidSeat.selector, missing));
        this.priceExternal(missing);
        vm.expectRevert(abi.encodeWithSelector(SeatLib.InvalidSeat.selector, missing));
        this.labelExternal(missing);
        vm.expectRevert(abi.encodeWithSelector(SeatLib.InvalidSeat.selector, missing));
        this.cabinExternal(missing);
        vm.expectRevert(abi.encodeWithSelector(SeatLib.InvalidSeat.selector, missing));
        this.positionExternal(missing);
        vm.expectRevert(abi.encodeWithSelector(SeatLib.InvalidSeat.selector, missing));
        this.priorityLabelExternal(missing);
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

    function priorityLabelExternal(uint16 seatId) external pure returns (string memory) {
        return SeatLib.priorityLabel(seatId);
    }

    /// @dev Independent of SeatLib: row 1–32, col 1–6, no B/E in rows 1–4.
    function _independentExists(uint16 seatId) private pure returns (bool) {
        uint16 r = seatId / 10;
        uint256 c = uint256(seatId) % 10;
        if (r < 1 || r > 32) return false;
        if (c < 1 || c > 6) return false;
        if (r <= 4 && (c == 2 || c == 5)) return false;
        return true;
    }
}
