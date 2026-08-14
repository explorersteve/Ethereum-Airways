// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {BoardingPassData, IBoardingPass} from "./interfaces/IBoardingPass.sol";
import {IBoardingPassRenderer} from "./interfaces/IBoardingPassRenderer.sol";
import {DateLib} from "./libraries/DateLib.sol";
import {JsonEscape} from "./libraries/JsonEscape.sol";
import {SeatLib} from "./libraries/SeatLib.sol";
import {SvgEscape} from "./libraries/SvgEscape.sol";

/// @title Fully onchain SVG + JSON metadata for Ethereum Airways boarding passes.
/// @notice Reads canonical pass data from `IBoardingPass`. Does not store passenger fields.
contract BoardingPassRenderer is IBoardingPassRenderer {
    IBoardingPass public immutable boardingPass;

    constructor(IBoardingPass boardingPass_) {
        boardingPass = boardingPass_;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        BoardingPassData memory data = boardingPass.getBoardingPass(tokenId);
        string memory svg = _craftSvg(tokenId, data);
        string memory image = string.concat("data:image/svg+xml;base64,", Base64.encode(bytes(svg)));
        string memory json = _metadataJson(data, image);
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function craftSvg(uint256 tokenId) external view returns (string memory) {
        return _craftSvg(tokenId, boardingPass.getBoardingPass(tokenId));
    }

    function _metadataJson(BoardingPassData memory data, string memory image)
        private
        view
        returns (string memory)
    {
        string memory seat = boardingPass.seatLabel(data.seatId);
        string memory handle = data.twitterHandle;
        string memory xValue = bytes(handle).length == 0 ? "" : string.concat("@", handle);

        return string.concat(
            '{"name":"',
            JsonEscape.escape(string.concat(unicode"Boarding Pass \u00b7 Seat ", seat)),
            '","description":"',
            JsonEscape.escape(
                "Onchain boarding pass to Ethereum. Passenger data recorded on this pass is permanently public."
            ),
            '","image":"',
            image,
            '","attributes":[',
            _attr("Destination", boardingPass.DESTINATION()),
            ",",
            _attr("Origin", boardingPass.ORIGIN()),
            ",",
            _attr("Trip", boardingPass.TRIP()),
            ",",
            _attr("Flight", boardingPass.FLIGHT()),
            ",",
            _attr("Seat", seat),
            ",",
            _attr("Seat Type", _seatType(data.seatId)),
            ",",
            _attr("Cabin", _cabin(data.seatId)),
            ",",
            _attr("Bags", Strings.toString(data.bagCount)),
            ",",
            _attr("Passenger", data.fullName),
            ",",
            _attr("Date of Birth", _isoDate(data.dateOfBirth)),
            ",",
            _attr("Birthday", _birthday(data.dateOfBirth)),
            ",",
            _attr("X", xValue),
            ",",
            _attr("Vessel Craft", Strings.toString(data.vesselCraftId)),
            ",",
            _attr("Vessel Entry", Strings.toString(data.vesselEntry)),
            "]}"
        );
    }

    function _attr(string memory trait, string memory value) private pure returns (string memory) {
        return string.concat(
            '{"trait_type":"', JsonEscape.escape(trait), '","value":"', JsonEscape.escape(value), '"}'
        );
    }

    function _craftSvg(uint256 tokenId, BoardingPassData memory data) private view returns (string memory) {
        string memory seat = boardingPass.seatLabel(data.seatId);
        string memory passenger = _asciiUpper(data.fullName);
        string memory origin = _asciiUpper(boardingPass.ORIGIN());
        string memory dest = _asciiUpper(boardingPass.DESTINATION());
        string memory handle = data.twitterHandle;
        string memory xLine = bytes(handle).length == 0 ? unicode"\u2014" : string.concat("@", handle);

        bytes32 pattern = keccak256(abi.encode(tokenId, data.traveler, data.vesselCraftId, data.vesselEntry));

        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">',
            "<style>text{font-family:ui-sans-serif,system-ui,sans-serif}</style>",
            '<rect width="1200" height="600" fill="#F7F6F3"/>',
            '<rect x="28" y="28" width="1144" height="544" rx="10" fill="#FFFFFF" stroke="#0B1B33" stroke-width="2"/>',
            '<rect x="28" y="28" width="18" height="544" rx="0" fill="#0B1B33"/>',
            _header(),
            _route(origin, dest),
            _passengerBlock(passenger),
            _detailGrid(data, seat, xLine),
            _perforation(),
            _stub(tokenId, data, seat, pattern),
            "</svg>"
        );
    }

    function _header() private pure returns (string memory) {
        return string.concat(
            '<text x="68" y="78" fill="#0B1B33" font-size="22" font-weight="700" letter-spacing="4">ETHEREUM AIRWAYS</text>',
            '<text x="68" y="104" fill="#2563FF" font-size="13" font-weight="600" letter-spacing="6">BOARDING PASS</text>'
        );
    }

    function _passengerBlock(string memory passenger) private pure returns (string memory) {
        return string.concat(
            '<text x="68" y="148" fill="#6B7280" font-size="11" font-weight="600" letter-spacing="3">PASSENGER</text>',
            '<text x="68" y="192" fill="#0B1B33" font-size="36" font-weight="700">',
            SvgEscape.escape(passenger),
            "</text>"
        );
    }

    function _route(string memory origin, string memory dest) private pure returns (string memory) {
        return string.concat(
            '<text x="68" y="248" fill="#0B1B33" font-size="28" font-weight="700">',
            SvgEscape.escape(origin),
            unicode'<tspan fill="#2563FF"> \u2192 </tspan>',
            SvgEscape.escape(dest),
            "</text>"
        );
    }

    function _detailGrid(BoardingPassData memory data, string memory seat, string memory xLine)
        private
        view
        returns (string memory)
    {
        return string.concat(
            _cell(68, 290, "FLIGHT", _asciiUpper(boardingPass.FLIGHT())),
            _cell(248, 290, "WHEN", _asciiUpper(boardingPass.DEPARTURE())),
            _cell(428, 290, "TRIP", _asciiUpper(boardingPass.TRIP())),
            _cell(648, 290, "SEAT", seat),
            _cell(68, 372, "SEAT TYPE", _asciiUpper(_seatType(data.seatId))),
            _cell(248, 372, "BAGS", Strings.toString(data.bagCount)),
            _cell(428, 372, "DATE OF BIRTH", _isoDate(data.dateOfBirth)),
            _cell(648, 372, "BIRTHDAY", _birthday(data.dateOfBirth)),
            _cell(68, 454, "X", xLine)
        );
    }

    function _cell(uint256 x, uint256 y, string memory label, string memory value)
        private
        pure
        returns (string memory)
    {
        return string.concat(
            '<text x="',
            Strings.toString(x),
            '" y="',
            Strings.toString(y),
            '" fill="#6B7280" font-size="11" font-weight="600" letter-spacing="2">',
            label,
            "</text>",
            '<text x="',
            Strings.toString(x),
            '" y="',
            Strings.toString(y + 28),
            '" fill="#0B1B33" font-size="20" font-weight="700">',
            SvgEscape.escape(value),
            "</text>"
        );
    }

    function _perforation() private pure returns (string memory) {
        return string.concat(
            '<circle cx="880" cy="28" r="16" fill="#F7F6F3"/>',
            '<circle cx="880" cy="572" r="16" fill="#F7F6F3"/>',
            '<line x1="880" y1="44" x2="880" y2="556" stroke="#0B1B33" stroke-width="2" stroke-dasharray="6 8"/>'
        );
    }

    function _stub(uint256 tokenId, BoardingPassData memory data, string memory seat, bytes32 pattern)
        private
        pure
        returns (string memory)
    {
        return string.concat(
            '<text x="910" y="86" fill="#6B7280" font-size="12" font-weight="600" letter-spacing="3">SEAT</text>',
            '<text x="910" y="168" fill="#0B1B33" font-size="72" font-weight="800">',
            SvgEscape.escape(seat),
            "</text>",
            '<text x="910" y="214" fill="#0B1B33" font-size="13">TOKEN #',
            Strings.toString(tokenId),
            "</text>",
            '<text x="910" y="238" fill="#0B1B33" font-size="13">',
            _shortAddr(data.traveler),
            "</text>",
            '<text x="910" y="278" fill="#6B7280" font-size="11" font-weight="600" letter-spacing="2">VESSEL CRAFT #',
            Strings.toString(data.vesselCraftId),
            "</text>",
            '<text x="910" y="302" fill="#6B7280" font-size="11" font-weight="600" letter-spacing="2">ENTRY #',
            Strings.toString(data.vesselEntry),
            "</text>",
            _pattern(pattern)
        );
    }

    /// @dev 16\times16 bit matrix from `keccak256(abi.encode(tokenId, traveler, craft, entry))`.
    ///      Decorative machine-readable block — not a QR code.
    function _pattern(bytes32 hash) private pure returns (string memory) {
        string memory cells = '<g fill="#0B1B33">';
        uint256 originX = 910;
        uint256 originY = 340;
        uint256 bit;
        for (uint256 row; row < 16; ++row) {
            for (uint256 col; col < 16; ++col) {
                uint8 b = uint8(hash[bit / 8]);
                bool on = ((b >> (7 - (bit % 8))) & 1) == 1;
                unchecked {
                    ++bit;
                }
                if (!on) continue;
                cells = string.concat(
                    cells,
                    '<rect x="',
                    Strings.toString(originX + col * 8),
                    '" y="',
                    Strings.toString(originY + row * 8),
                    '" width="6" height="6"/>'
                );
            }
        }
        return string.concat(cells, "</g>");
    }

    function _seatType(uint16 seatId) private pure returns (string memory) {
        SeatLib.SeatPosition p = SeatLib.position(seatId);
        if (p == SeatLib.SeatPosition.Window) return "Window";
        if (p == SeatLib.SeatPosition.Middle) return "Middle";
        return "Aisle";
    }

    function _cabin(uint16 seatId) private pure returns (string memory) {
        SeatLib.Cabin c = SeatLib.cabin(seatId);
        if (c == SeatLib.Cabin.First) return "First";
        if (c == SeatLib.Cabin.Comfort) return "Comfort";
        if (c == SeatLib.Cabin.Exit) return "Exit";
        if (c == SeatLib.Cabin.Main) return "Main";
        return "Rear";
    }

    function _isoDate(uint32 dob) private pure returns (string memory) {
        (uint256 year, uint256 month, uint256 day) = DateLib.split(dob);
        return string.concat(Strings.toString(year), "-", _pad2(month), "-", _pad2(day));
    }

    function _birthday(uint32 dob) private pure returns (string memory) {
        (, uint256 month, uint256 day) = DateLib.split(dob);
        // month is 1–12 after DateLib validation at mint
        // forge-lint: disable-next-line(unsafe-typecast)
        return string.concat(DateLib.monthName(uint8(month)), " ", Strings.toString(day));
    }

    function _pad2(uint256 n) private pure returns (string memory) {
        if (n >= 10) return Strings.toString(n);
        return string.concat("0", Strings.toString(n));
    }

    function _asciiUpper(string memory s) private pure returns (string memory) {
        bytes memory src = bytes(s);
        uint256 n = src.length;
        bytes memory b = new bytes(n);
        for (uint256 i; i < n; ++i) {
            uint8 c = uint8(src[i]);
            if (c >= 0x61 && c <= 0x7a) c -= 0x20;
            b[i] = bytes1(c);
        }
        return string(b);
    }

    function _shortAddr(address account) private pure returns (string memory) {
        bytes memory hexAddr = bytes(Strings.toHexString(account));
        bytes memory out = new bytes(13);
        out[0] = hexAddr[0];
        out[1] = hexAddr[1];
        out[2] = hexAddr[2];
        out[3] = hexAddr[3];
        out[4] = hexAddr[4];
        out[5] = hexAddr[5];
        out[6] = 0xe2;
        out[7] = 0x80;
        out[8] = 0xa6;
        out[9] = hexAddr[38];
        out[10] = hexAddr[39];
        out[11] = hexAddr[40];
        out[12] = hexAddr[41];
        return string(out);
    }
}
