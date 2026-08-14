// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Seat geometry and deterministic ETH pricing for Ethereum Airways.
/// @dev All functions are internal pure. `exists` is the only silent false;
///      every other public-facing getter reverts `InvalidSeat` for missing seats.
library SeatLib {
    enum Cabin {
        First,
        Comfort,
        Exit,
        Main,
        Rear
    }

    enum SeatPosition {
        Window,
        Middle,
        Aisle
    }

    error InvalidSeat(uint16 seatId);

    function row(uint16 seatId) internal pure returns (uint16) {
        return seatId / 10;
    }

    function col(uint16 seatId) internal pure returns (uint8) {
        uint256 c = uint256(seatId) % 10;
        // remainder of any integer modulo 10 is 0–9
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint8(c);
    }

    /// @dev Rows 1–32, columns 1–6 (A–F). Rows 1–4 have no B/E (col 2 or 5).
    function exists(uint16 seatId) internal pure returns (bool) {
        uint16 r = row(seatId);
        uint8 c = col(seatId);
        if (r < 1 || r > 32) return false;
        if (c < 1 || c > 6) return false;
        if (r <= 4 && (c == 2 || c == 5)) return false;
        return true;
    }

    function cabin(uint16 seatId) internal pure returns (Cabin) {
        _requireExists(seatId);
        uint16 r = row(seatId);
        if (r <= 4) return Cabin.First;
        if (r <= 9) return Cabin.Comfort;
        if (r <= 11) return Cabin.Exit;
        if (r <= 24) return Cabin.Main;
        return Cabin.Rear;
    }

    function position(uint16 seatId) internal pure returns (SeatPosition) {
        _requireExists(seatId);
        uint8 c = col(seatId);
        if (c == 1 || c == 6) return SeatPosition.Window;
        if (c == 2 || c == 5) return SeatPosition.Middle;
        return SeatPosition.Aisle;
    }

    /// @dev e.g. `12A`. Row is decimal; column 1–6 maps to A–F.
    function label(uint16 seatId) internal pure returns (string memory) {
        _requireExists(seatId);
        uint16 r = row(seatId);
        bytes memory letters = bytes("ABCDEF");
        bytes1 letter = letters[uint256(col(seatId)) - 1];
        bytes memory digits = bytes("0123456789");
        if (r < 10) {
            bytes memory oneDigit = new bytes(2);
            oneDigit[0] = digits[uint256(r)];
            oneDigit[1] = letter;
            return string(oneDigit);
        }
        bytes memory twoDigit = new bytes(3);
        twoDigit[0] = digits[uint256(r) / 10];
        twoDigit[1] = digits[uint256(r) % 10];
        twoDigit[2] = letter;
        return string(twoDigit);
    }

    /// @dev Same strings as the TypeScript `priorityLabel` mirror.
    function priorityLabel(uint16 seatId) internal pure returns (string memory) {
        Cabin c = cabin(seatId);
        if (c == Cabin.First) return "First Class";
        if (c == Cabin.Comfort) return "Comfort";
        if (c == Cabin.Exit) return "Emergency Exit Row";
        if (c == Cabin.Rear) {
            SeatPosition p = position(seatId);
            if (p == SeatPosition.Window) return "Rear Window";
            if (p == SeatPosition.Aisle) return "Rear Aisle";
            return "Rear Middle";
        }
        SeatPosition mainPos = position(seatId);
        if (mainPos == SeatPosition.Window) return "Window";
        if (mainPos == SeatPosition.Aisle) return "Aisle";
        return "Middle";
    }

    /// @notice Seat surcharge in wei. Integer division in middle-seat formulas is deliberate.
    ///
    /// Main middle = window/aisle * 2 / 3 (truncated), exact wei by row:
    ///   12: 6000000000000000
    ///   13: 5666666666666666
    ///   14: 5333333333333333
    ///   15: 5000000000000000
    ///   16: 4666666666666666
    ///   17: 4333333333333333
    ///   18: 4000000000000000
    ///   19: 3666666666666666
    ///   20: 3333333333333333
    ///   21: 3000000000000000
    ///   22: 2666666666666666
    ///   23: 2333333333333333
    ///   24: 2000000000000000
    ///
    /// Rear middle = window/aisle / 2, exact wei by row:
    ///   25: 500000000000000
    ///   26: 440000000000000
    ///   27: 380000000000000
    ///   28: 320000000000000
    ///   29: 260000000000000
    ///   30: 200000000000000
    ///   31: 140000000000000
    ///   32: 80000000000000
    function price(uint16 seatId) internal pure returns (uint256) {
        Cabin c = cabin(seatId);
        uint16 r = row(seatId);

        if (c == Cabin.First) {
            return 0.06 ether - uint256(r - 1) * 0.005 ether;
        }
        if (c == Cabin.Comfort) {
            return 0.03 ether - uint256(r - 5) * 0.002 ether;
        }
        if (c == Cabin.Exit) {
            return r == 10 ? 0.018 ether : 0.016 ether;
        }
        if (c == Cabin.Main) {
            uint256 windowOrAisle = 0.009 ether - uint256(r - 12) * 0.0005 ether;
            if (position(seatId) == SeatPosition.Middle) {
                return (windowOrAisle * 2) / 3;
            }
            return windowOrAisle;
        }

        uint256 rearWA = 0.001 ether - uint256(r - 25) * 0.00012 ether;
        if (position(seatId) == SeatPosition.Middle) {
            return rearWA / 2;
        }
        return rearWA;
    }

    function _requireExists(uint16 seatId) private pure {
        if (!exists(seatId)) revert InvalidSeat(seatId);
    }
}
