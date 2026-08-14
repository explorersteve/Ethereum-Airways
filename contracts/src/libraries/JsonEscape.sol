// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Single-pass JSON string escaping.
/// @dev Escapes `\` and `"`, and emits control characters as `\u00XX`.
///      Never writes a raw newline or tab into a JSON string value.
library JsonEscape {
    bytes16 private constant _HEX = "0123456789abcdef";

    function escape(string memory input) internal pure returns (string memory) {
        bytes memory src = bytes(input);
        uint256 n = src.length;
        bytes memory buf = new bytes(n * 6);
        uint256 w;

        for (uint256 i; i < n; ++i) {
            uint8 c = uint8(src[i]);
            if (c == 0x5c) {
                buf[w] = 0x5c;
                buf[w + 1] = 0x5c;
                unchecked {
                    w += 2;
                }
            } else if (c == 0x22) {
                buf[w] = 0x5c;
                buf[w + 1] = 0x22;
                unchecked {
                    w += 2;
                }
            } else if (c < 0x20 || c == 0x7f) {
                buf[w] = 0x5c;
                buf[w + 1] = 0x75;
                buf[w + 2] = 0x30;
                buf[w + 3] = 0x30;
                buf[w + 4] = bytes1(_HEX[c >> 4]);
                buf[w + 5] = bytes1(_HEX[c & 0x0f]);
                unchecked {
                    w += 6;
                }
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
}
