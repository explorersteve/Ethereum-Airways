// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {DateLib} from "../src/libraries/DateLib.sol";

contract DateLibTest is Test {
    function test_ValidDates() public pure {
        assertTrue(DateLib.isValid(19980512));
        assertTrue(DateLib.isValid(20000229));
        assertTrue(DateLib.isValid(20240131));
        assertTrue(DateLib.isValid(10101));
        assertTrue(DateLib.isValid(99991231));
        assertTrue(DateLib.isValid(20240430));
    }

    function test_LeapYears() public pure {
        assertFalse(DateLib.isValid(19980229));
        assertTrue(DateLib.isValid(20000229));
        assertFalse(DateLib.isValid(19000229));
        assertTrue(DateLib.isValid(20040229));
        assertFalse(DateLib.isValid(21000229));
    }

    function test_InvalidMonthsAndDays() public pure {
        assertFalse(DateLib.isValid(19980012)); // month 0
        assertFalse(DateLib.isValid(19981301)); // month 13
        assertFalse(DateLib.isValid(19980100)); // day 0
        assertFalse(DateLib.isValid(19980132)); // day 32
        assertFalse(DateLib.isValid(19980431)); // April 31
        assertFalse(DateLib.isValid(19980631));
        assertFalse(DateLib.isValid(19980931));
        assertFalse(DateLib.isValid(19981131));
        assertFalse(DateLib.isValid(0));
        assertFalse(DateLib.isValid(101)); // year 0, month 1, day 1
        assertFalse(DateLib.isValid(100000101)); // year 10000
    }

    function test_Split() public pure {
        (uint256 year, uint256 month, uint256 day) = DateLib.split(19980512);
        assertEq(year, 1998);
        assertEq(month, 5);
        assertEq(day, 12);

        (year, month, day) = DateLib.split(20000229);
        assertEq(year, 2000);
        assertEq(month, 2);
        assertEq(day, 29);
    }

    function test_MonthNames() public pure {
        assertEq(DateLib.monthName(1), "JAN");
        assertEq(DateLib.monthName(2), "FEB");
        assertEq(DateLib.monthName(3), "MAR");
        assertEq(DateLib.monthName(4), "APR");
        assertEq(DateLib.monthName(5), "MAY");
        assertEq(DateLib.monthName(6), "JUN");
        assertEq(DateLib.monthName(7), "JUL");
        assertEq(DateLib.monthName(8), "AUG");
        assertEq(DateLib.monthName(9), "SEP");
        assertEq(DateLib.monthName(10), "OCT");
        assertEq(DateLib.monthName(11), "NOV");
        assertEq(DateLib.monthName(12), "DEC");
    }

    function test_RevertWhen_InvalidMonthName() public {
        vm.expectRevert(abi.encodeWithSelector(DateLib.InvalidMonth.selector, uint8(0)));
        this.monthNameExternal(0);
        vm.expectRevert(abi.encodeWithSelector(DateLib.InvalidMonth.selector, uint8(13)));
        this.monthNameExternal(13);
    }

    function monthNameExternal(uint8 month) external pure returns (string memory) {
        return DateLib.monthName(month);
    }
}
