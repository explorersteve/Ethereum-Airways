// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Single-pass SVG/XML escaping for user-controlled strings.
/// @dev Ampersand is handled first in the match order so `&` in entities is never
///      double-escaped. Control characters (U+0000–U+001F and DEL) are dropped.
library SvgEscape {
    function escape(string memory input) internal pure returns (string memory) {
        bytes memory src = bytes(input);
        uint256 n = src.length;
        bytes memory buf = new bytes(n * 6);
        uint256 w;

        for (uint256 i; i < n; ++i) {
            uint8 c = uint8(src[i]);
            if (c < 0x20 || c == 0x7f) continue;
            if (c == 0x26) {
                w = _copy(buf, w, "&amp;");
            } else if (c == 0x3c) {
                w = _copy(buf, w, "&lt;");
            } else if (c == 0x3e) {
                w = _copy(buf, w, "&gt;");
            } else if (c == 0x22) {
                w = _copy(buf, w, "&quot;");
            } else if (c == 0x27) {
                w = _copy(buf, w, "&apos;");
            } else {
                buf[w] = bytes1(c);
                unchecked {
                    ++w;
                }
            }
        }

        assembly ("memory-safe") {
            mstore(buf, w)
        }
        return string(buf);
    }

    function _copy(bytes memory buf, uint256 w, string memory lit) private pure returns (uint256) {
        bytes memory b = bytes(lit);
        uint256 len = b.length;
        for (uint256 i; i < len; ++i) {
            buf[w + i] = b[i];
        }
        return w + len;
    }
}
