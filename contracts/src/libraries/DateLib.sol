// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Packed `yyyymmdd` calendar validation for date-of-birth fields.
library DateLib {
    error InvalidMonth(uint8 month);

    function split(uint32 yyyymmdd) internal pure returns (uint256 year, uint256 month, uint256 day) {
        year = uint256(yyyymmdd) / 10_000;
        month = (uint256(yyyymmdd) / 100) % 100;
        day = uint256(yyyymmdd) % 100;
    }

    /// @dev Gregorian leap years: divisible by 4, except centuries not divisible by 400.
    ///      Year must be 1–9999 so the packed encoding matches the TS ISO mirror.
    function isValid(uint32 yyyymmdd) internal pure returns (bool) {
        (uint256 year, uint256 month, uint256 day) = split(yyyymmdd);
        if (year < 1 || year > 9999) return false;
        if (month < 1 || month > 12) return false;
        if (day < 1) return false;
        return day <= _daysInMonth(year, month);
    }

    function monthName(uint8 month) internal pure returns (string memory) {
        if (month == 1) return "JAN";
        if (month == 2) return "FEB";
        if (month == 3) return "MAR";
        if (month == 4) return "APR";
        if (month == 5) return "MAY";
        if (month == 6) return "JUN";
        if (month == 7) return "JUL";
        if (month == 8) return "AUG";
        if (month == 9) return "SEP";
        if (month == 10) return "OCT";
        if (month == 11) return "NOV";
        if (month == 12) return "DEC";
        revert InvalidMonth(month);
    }

    function _daysInMonth(uint256 year, uint256 month) private pure returns (uint256) {
        if (month == 2) {
            return _isLeapYear(year) ? 29 : 28;
        }
        if (month == 4 || month == 6 || month == 9 || month == 11) {
            return 30;
        }
        return 31;
    }

    function _isLeapYear(uint256 year) private pure returns (bool) {
        return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    }
}
