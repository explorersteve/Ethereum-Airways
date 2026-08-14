// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

import {VesselFixture} from "./helpers/VesselFixture.sol";
import {BoardingPass} from "../src/BoardingPass.sol";
import {BoardingPassRenderer} from "../src/BoardingPassRenderer.sol";
import {JsonEscape} from "../src/libraries/JsonEscape.sol";
import {SvgEscape} from "../src/libraries/SvgEscape.sol";

contract BoardingPassRendererTest is VesselFixture {
    uint16 internal constant SEAT_12A = 121;
    uint16 internal constant SEAT_12B = 122;
    uint32 internal constant DOB = 19980512;
    uint256 internal constant SNAPSHOT_T0 = 1_700_000_000;

    /// @dev keccak256 of `tokenURI(12A)` for the fixed snapshot mint. Locked after first green run.
    bytes32 internal constant SNAPSHOT_TOKEN_URI_HASH =
        0x68cc75bc70075efb7c29bffbff61206d1cdd6df50a97403bdcb25589a068518b;

    BoardingPass internal pass;
    BoardingPassRenderer internal renderer;
    address internal owner;
    address internal treasury;
    address internal traveler;

    function setUp() public override {
        super.setUp();
        owner = makeAddr("owner");
        treasury = makeAddr("treasury");
        traveler = makeAddr("traveler");
        vm.deal(traveler, 100 ether);

        // forge-lint: disable-next-line(unsafe-typecast)
        pass = new BoardingPass(address(vessel), uint16(MANIFEST_CRAFT_ID), treasury, owner);
        vm.prank(craftOwner);
        vessel.setDelegate(MANIFEST_CRAFT_ID, address(pass));

        renderer = new BoardingPassRenderer(pass);
        vm.prank(owner);
        pass.setRenderer(address(renderer));
    }

    function test_TokenURIRevertsForUnminted() public {
        vm.expectRevert(
            abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, uint256(SEAT_12A))
        );
        renderer.tokenURI(SEAT_12A);
    }

    function test_TokenURIDecodesToValidJsonAndSvg() public {
        _mintAda(SEAT_12A, 1);

        string memory uri = renderer.tokenURI(SEAT_12A);
        string memory json = _decodeDataUri(uri, "data:application/json;base64,");

        assertEq(vm.parseJsonString(json, ".name"), unicode"Boarding Pass \u00b7 Seat 12A");
        string memory description = vm.parseJsonString(json, ".description");
        assertTrue(_contains(description, "Onchain boarding pass to Ethereum"));
        assertTrue(_contains(description, "permanently public"));

        assertEq(vm.parseJsonString(json, ".attributes[0].value"), "Ethereum");
        assertEq(vm.parseJsonString(json, ".attributes[1].value"), "Current Location");
        assertEq(vm.parseJsonString(json, ".attributes[2].value"), "Round Trip");
        assertEq(vm.parseJsonString(json, ".attributes[3].value"), "ETH001");
        assertEq(vm.parseJsonString(json, ".attributes[4].value"), "12A");
        assertEq(vm.parseJsonString(json, ".attributes[5].value"), "Window");
        assertEq(vm.parseJsonString(json, ".attributes[6].value"), "Main");
        assertEq(vm.parseJsonString(json, ".attributes[7].value"), "1");
        assertEq(vm.parseJsonString(json, ".attributes[8].value"), "Ada Lovelace");
        assertEq(vm.parseJsonString(json, ".attributes[9].value"), "1998-05-12");
        assertEq(vm.parseJsonString(json, ".attributes[10].value"), "MAY 12");
        assertEq(vm.parseJsonString(json, ".attributes[11].value"), "@ada");
        assertEq(vm.parseJsonString(json, ".attributes[12].value"), "6669");
        assertEq(vm.parseJsonString(json, ".attributes[13].value"), "1");

        string memory image = vm.parseJsonString(json, ".image");
        string memory svg = _decodeDataUri(image, "data:image/svg+xml;base64,");
        _assertWellFormedSvg(svg);
        assertTrue(_contains(svg, "ADA LOVELACE"));
        assertTrue(_contains(svg, "ETHEREUM"));
        assertTrue(_contains(svg, "12A"));
        assertTrue(_contains(svg, "WINDOW"));
        assertTrue(_contains(svg, ">1</text>"));
        assertTrue(_contains(svg, "1998-05-12"));
        assertTrue(_contains(svg, "MAY 12"));
        assertTrue(_contains(svg, "CRAFT #6669"));
        assertTrue(_contains(svg, "ENTRY #1"));
        assertFalse(_contains(svg, "ipfs"));
        assertFalse(_contains(svg, "arweave"));
    }

    function test_AdversarialUserStringsStayInert() public {
        _mintNamed(SEAT_12A, "<script>alert(1)</script>", "x");
        string memory svg = renderer.craftSvg(SEAT_12A);
        assertFalse(_contains(svg, "<script>"));
        assertTrue(_contains(svg, "&lt;SCRIPT&gt;ALERT(1)&lt;/SCRIPT&gt;"));
        _assertJsonParses(renderer.tokenURI(SEAT_12A));

        _mintNamed(SEAT_12B, "A&B", "amp");
        svg = renderer.craftSvg(SEAT_12B);
        assertTrue(_contains(svg, "A&amp;B"));
        assertFalse(_contains(bytes(svg), bytes("A&B")));
        _assertJsonParses(renderer.tokenURI(SEAT_12B));
    }

    function test_AdversarialQuotesAndBackslash() public {
        uint16 seatC = 123;
        _mintNamed(seatC, "\" onclick=\"alert(1)", "back\\slash\"quote");

        string memory svg = renderer.craftSvg(seatC);
        assertTrue(_contains(svg, "&quot;"));
        assertFalse(_contains(svg, '" onclick="'));
        assertFalse(_contains(svg, "<script"));

        string memory json = _decodeDataUri(renderer.tokenURI(seatC), "data:application/json;base64,");
        assertEq(vm.parseJsonString(json, ".attributes[8].value"), "\" onclick=\"alert(1)");
        assertEq(vm.parseJsonString(json, ".attributes[11].value"), "@back\\slash\"quote");
    }

    function test_MultibyteNameRendersAndParses() public {
        string memory name =
            unicode"\u4f60\u597d\u4f60\u597d\u4f60\u597d\u4f60\u597d\u4f60\u597d\u4f60\u597d\u4f60\u597d\u4f60\u597d";
        assertEq(bytes(name).length, 48);
        _mintNamed(SEAT_12A, name, "han");

        string memory svg = renderer.craftSvg(SEAT_12A);
        assertTrue(_contains(svg, name));
        string memory json = _decodeDataUri(renderer.tokenURI(SEAT_12A), "data:application/json;base64,");
        assertEq(vm.parseJsonString(json, ".attributes[8].value"), name);
    }

    function test_DeterministicAndDistinct() public {
        _mintAda(SEAT_12A, 1);
        string memory a1 = renderer.tokenURI(SEAT_12A);
        string memory a2 = renderer.tokenURI(SEAT_12A);
        assertEq(keccak256(bytes(a1)), keccak256(bytes(a2)));
        assertEq(renderer.craftSvg(SEAT_12A), renderer.craftSvg(SEAT_12A));

        uint256 priceB = pass.quote(SEAT_12B, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: priceB}(SEAT_12B, "Ada Lovelace", DOB, "ada", 0);
        string memory b1 = renderer.tokenURI(SEAT_12B);
        assertTrue(keccak256(bytes(a1)) != keccak256(bytes(b1)));
    }

    function test_SnapshotHashLocked() public {
        vm.warp(SNAPSHOT_T0);
        uint256 price = pass.quote(SEAT_12A, 1);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 1);

        bytes32 got = keccak256(bytes(renderer.tokenURI(SEAT_12A)));
        emit log_named_bytes32("tokenURI snapshot", got);
        assertEq(got, SNAPSHOT_TOKEN_URI_HASH);
    }

    function test_DumpSampleSvg() public {
        _mintAda(SEAT_12A, 1);
        vm.writeFile("./out/sample-pass.svg", renderer.craftSvg(SEAT_12A));
        assertTrue(bytes(vm.readFile("./out/sample-pass.svg")).length > 0);
    }

    function test_SvgEscapeOrderAndControls() public pure {
        assertEq(SvgEscape.escape("&<>\"'"), "&amp;&lt;&gt;&quot;&apos;");
        assertEq(SvgEscape.escape("A&B"), "A&amp;B");
        assertEq(SvgEscape.escape(string(abi.encodePacked("a", bytes1(0x01), "b", bytes1(0x7f), "c"))), "abc");
        assertEq(SvgEscape.escape("<script>"), "&lt;script&gt;");
    }

    function test_JsonEscapeControlsNeverRaw() public pure {
        string memory escaped =
            JsonEscape.escape(string(abi.encodePacked("a", bytes1(0x0a), "b", bytes1(0x09), '"', "\\")));
        assertEq(escaped, "a\\u000ab\\u0009\\\"\\\\");
        assertFalse(_contains(escaped, "\n"));
        assertFalse(_contains(escaped, "\t"));
    }

    function _mintAda(uint16 seatId, uint16 bags) private {
        uint256 price = pass.quote(seatId, bags);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(seatId, "Ada Lovelace", DOB, "ada", bags);
    }

    function _mintNamed(uint16 seatId, string memory fullName, string memory handle) private {
        uint256 price = pass.quote(seatId, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(seatId, fullName, DOB, handle, 0);
    }

    function _decodeDataUri(string memory uri, string memory prefix) private pure returns (string memory) {
        bytes memory raw = bytes(uri);
        bytes memory p = bytes(prefix);
        require(raw.length > p.length, "short uri");
        for (uint256 i; i < p.length; ++i) {
            require(raw[i] == p[i], "prefix");
        }
        bytes memory b64 = new bytes(raw.length - p.length);
        for (uint256 i; i < b64.length; ++i) {
            b64[i] = raw[i + p.length];
        }
        return string(Base64.decode(string(b64)));
    }

    function _assertWellFormedSvg(string memory svg) private pure {
        assertTrue(_startsWith(svg, "<svg "));
        assertTrue(_contains(svg, 'xmlns="http://www.w3.org/2000/svg"'));
        assertTrue(_endsWith(svg, "</svg>"));
        assertTrue(_contains(svg, 'viewBox="0 0 1200 600"'));
    }

    function _assertJsonParses(string memory uri) private pure {
        string memory json = _decodeDataUri(uri, "data:application/json;base64,");
        vm.parseJson(json);
        vm.parseJsonString(json, ".name");
        vm.parseJsonString(json, ".image");
    }

    function _startsWith(string memory s, string memory prefix) private pure returns (bool) {
        bytes memory a = bytes(s);
        bytes memory p = bytes(prefix);
        if (a.length < p.length) return false;
        for (uint256 i; i < p.length; ++i) {
            if (a[i] != p[i]) return false;
        }
        return true;
    }

    function _endsWith(string memory s, string memory suffix) private pure returns (bool) {
        bytes memory a = bytes(s);
        bytes memory p = bytes(suffix);
        if (a.length < p.length) return false;
        uint256 off = a.length - p.length;
        for (uint256 i; i < p.length; ++i) {
            if (a[off + i] != p[i]) return false;
        }
        return true;
    }

    function _contains(string memory hay, string memory needle) private pure returns (bool) {
        return _contains(bytes(hay), bytes(needle));
    }

    function _contains(bytes memory hay, bytes memory needle) private pure returns (bool) {
        if (needle.length == 0 || needle.length > hay.length) return false;
        uint256 n = hay.length - needle.length + 1;
        for (uint256 i; i < n; ++i) {
            bool ok = true;
            for (uint256 j; j < needle.length; ++j) {
                if (hay[i + j] != needle[j]) {
                    ok = false;
                    break;
                }
            }
            if (ok) return true;
        }
        return false;
    }
}
