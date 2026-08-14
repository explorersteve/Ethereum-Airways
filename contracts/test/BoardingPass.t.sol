// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

import {BoardingPassFixture} from "./helpers/BoardingPassFixture.sol";
import {BoardingPass} from "../src/BoardingPass.sol";
import {BoardingPassRenderer} from "../src/BoardingPassRenderer.sol";
import {BoardingPassData} from "../src/interfaces/IBoardingPass.sol";
import {IVessel} from "../src/interfaces/IVessel.sol";

contract MockRenderer {
    function tokenURI(uint256 tokenId) external pure returns (string memory) {
        return string.concat("data:application/json,{\"id\":", _u(tokenId), "}");
    }

    function _u(uint256 n) private pure returns (string memory) {
        if (n == 0) return "0";
        uint256 len;
        uint256 m = n;
        while (m > 0) {
            len++;
            m /= 10;
        }
        bytes memory buf = new bytes(len);
        while (n > 0) {
            len--;
            buf[len] = bytes1(uint8(48 + (n % 10)));
            n /= 10;
        }
        return string(buf);
    }
}

contract RejectEther {
    receive() external payable {
        revert();
    }
}

/// @dev Vessel that accepts writes but does not increment `craftToEntry`.
contract NonIncrementingVessel is IVessel {
    address private _owner;
    address private _delegate;
    bool private _vault = true;
    bool private _locked;
    uint256 private _entry;

    constructor() {
        _owner = msg.sender;
    }

    function setDelegateForTest(address delegate_) external {
        _delegate = delegate_;
    }

    function craftToVaultStatus(uint256) external view returns (bool) {
        return _vault;
    }

    function craftToLocked(uint256) external view returns (bool) {
        return _locked;
    }

    function craftToDelegate(uint256) external view returns (address) {
        return _delegate;
    }

    function craftToEntry(uint256) external view returns (uint256) {
        return _entry;
    }

    function craftToClaimed(uint256) external pure returns (bool) {
        return true;
    }

    function ownerOf(uint256) external view returns (address) {
        return _owner;
    }

    function vaultToEntry(uint256, uint256) external pure returns (bytes memory) {
        return "";
    }

    function setDelegate(uint256, address delegate_) external {
        _delegate = delegate_;
    }

    function setPayloadHolder(uint256, bytes calldata) external {}
}

contract BoardingPassTest is BoardingPassFixture {
    function test_HappyPathMintIsAtomic() public {
        uint16 bags = 1;
        uint256 price = pass.quote(SEAT_12A, bags);
        uint256 t0 = 1_700_000_000;
        vm.warp(t0);

        vm.expectEmit(true, true, true, true, address(pass));
        emit BoardingPass.BoardingPassMinted(traveler, SEAT_12A, SEAT_12A, price, bags, MANIFEST_CRAFT_ID, 1);

        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", bags);

        assertEq(pass.ownerOf(SEAT_12A), traveler);
        assertEq(pass.balanceOf(traveler), 1);
        assertFalse(pass.isSeatAvailable(SEAT_12A));
        assertEq(address(pass).balance, price);
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 1);

        BoardingPassData memory data = pass.getBoardingPass(SEAT_12A);
        assertEq(data.traveler, traveler);
        assertEq(data.seatId, SEAT_12A);
        assertEq(data.fullName, "Ada Lovelace");
        assertEq(data.dateOfBirth, DOB);
        assertEq(data.twitterHandle, "ada");
        assertEq(data.bagCount, bags);
        assertEq(data.totalPaid, price);
        assertEq(data.mintedAt, t0);
        assertEq(data.vesselCraftId, MANIFEST_CRAFT_ID);
        assertEq(data.vesselEntry, 1);
        assertEq(pass.vesselPayloadFor(SEAT_12A), vessel.vaultToEntry(MANIFEST_CRAFT_ID, 1));
    }

    function test_TokenIdEqualsSeatIdAcrossCabins() public {
        uint16[5] memory seats = [uint16(11), 51, 101, 121, 251]; // 1A, 5A, 10A, 12A, 25A
        for (uint256 i = 0; i < seats.length; i++) {
            uint16 seatId = seats[i];
            uint256 price = pass.quote(seatId, 0);
            vm.prank(traveler);
            pass.bookAndMint{value: price}(seatId, "Ada Lovelace", DOB, "ada", 0);
            assertEq(pass.ownerOf(uint256(seatId)), traveler);
            assertEq(pass.getBoardingPass(uint256(seatId)).seatId, seatId);
        }
    }

    function test_RevertWhen_InvalidSeat() public {
        uint16 missing = 12; // 1B
        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.InvalidSeat.selector, missing));
        pass.bookAndMint{value: 1 ether}(missing, "Ada Lovelace", DOB, "ada", 0);
    }

    function test_RevertWhen_DuplicateSeat() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        address other = makeAddr("other");
        vm.deal(other, 10 ether);
        vm.prank(other);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.SeatAlreadyClaimed.selector, SEAT_12A));
        pass.bookAndMint{value: price}(SEAT_12A, "Other Person", DOB, "other", 0);
    }

    function test_RevertWhen_InvalidName() public {
        uint256 price = pass.quote(SEAT_12A, 0);

        vm.prank(traveler);
        vm.expectRevert(BoardingPass.InvalidName.selector);
        pass.bookAndMint{value: price}(SEAT_12A, "", DOB, "ada", 0);

        vm.prank(traveler);
        vm.expectRevert(BoardingPass.InvalidName.selector);
        pass.bookAndMint{value: price}(SEAT_12A, _repeat("n", 49), DOB, "ada", 0);

        vm.prank(traveler);
        vm.expectRevert(BoardingPass.InvalidName.selector);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada\nLovelace", DOB, "ada", 0);

        bytes memory del = bytes("Ada Lovelace");
        del[3] = bytes1(0x7f);
        vm.prank(traveler);
        vm.expectRevert(BoardingPass.InvalidName.selector);
        pass.bookAndMint{value: price}(SEAT_12A, string(del), DOB, "ada", 0);
    }

    function test_RevertWhen_InvalidDateOfBirth() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        uint32 notLeap = 19980229;
        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.InvalidDateOfBirth.selector, notLeap));
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", notLeap, "ada", 0);
    }

    function test_RevertWhen_InvalidTwitterHandle() public {
        uint256 price = pass.quote(SEAT_12A, 0);

        vm.prank(traveler);
        vm.expectRevert(BoardingPass.InvalidTwitterHandle.selector);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "@ada", 0);

        vm.prank(traveler);
        vm.expectRevert(BoardingPass.InvalidTwitterHandle.selector);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, _repeat("h", 33), 0);

        vm.prank(traveler);
        vm.expectRevert(BoardingPass.InvalidTwitterHandle.selector);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada\t", 0);

        bytes memory delHandle = bytes("ada");
        delHandle[1] = bytes1(0x7f);
        vm.prank(traveler);
        vm.expectRevert(BoardingPass.InvalidTwitterHandle.selector);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, string(delHandle), 0);
    }

    function test_RevertWhen_IncorrectPaymentOverAndUnder() public {
        uint256 price = pass.quote(SEAT_12A, 0);

        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.IncorrectPayment.selector, price, price - 1));
        pass.bookAndMint{value: price - 1}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.IncorrectPayment.selector, price, price + 1));
        pass.bookAndMint{value: price + 1}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        assertTrue(pass.isSeatAvailable(SEAT_12A));
        assertEq(address(pass).balance, 0);
    }

    function test_PauseBlocksBookingOnly() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        address renderer = address(new MockRenderer());
        vm.startPrank(owner);
        pass.setRenderer(renderer);
        pass.pause();
        vm.stopPrank();

        uint16 otherSeat = 122; // 12B
        uint256 otherPrice = pass.quote(otherSeat, 0);
        vm.prank(traveler);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        pass.bookAndMint{value: otherPrice}(otherSeat, "Ada Lovelace", DOB, "ada", 0);

        address to = makeAddr("to");
        vm.prank(traveler);
        pass.transferFrom(traveler, to, SEAT_12A);
        assertEq(pass.ownerOf(SEAT_12A), to);
        assertEq(pass.tokenURI(SEAT_12A), "data:application/json,{\"id\":121}");
    }

    function test_TransferDoesNotAlterTravelerRecord() public {
        BoardingPassRenderer renderer = new BoardingPassRenderer(pass);
        vm.prank(owner);
        pass.setRenderer(address(renderer));

        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        address to = makeAddr("to");
        vm.prank(traveler);
        pass.transferFrom(traveler, to, SEAT_12A);

        assertEq(pass.ownerOf(SEAT_12A), to);
        BoardingPassData memory data = pass.getBoardingPass(SEAT_12A);
        assertEq(data.traveler, traveler);
        assertEq(data.fullName, "Ada Lovelace");

        string memory uri = pass.tokenURI(SEAT_12A);
        string memory json = _decodeDataUri(uri, "data:application/json;base64,");
        assertTrue(_contains(json, "Ada Lovelace"));
    }

    function test_WithdrawSendsFullBalanceToTreasury() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        uint256 before = treasury.balance;
        vm.prank(owner);
        pass.withdraw();
        assertEq(treasury.balance, before + price);
        assertEq(address(pass).balance, 0);
    }

    function test_RevertWhen_WithdrawNonOwner() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, traveler));
        pass.withdraw();
    }

    function test_RevertWhen_NothingToWithdraw() public {
        vm.prank(owner);
        vm.expectRevert(BoardingPass.NothingToWithdraw.selector);
        pass.withdraw();
    }

    function test_RevertWhen_TransferFailed() public {
        RejectEther sink = new RejectEther();
        vm.prank(owner);
        pass.setTreasury(address(sink));

        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        vm.prank(owner);
        vm.expectRevert(BoardingPass.TransferFailed.selector);
        pass.withdraw();
    }

    function test_RevertWhen_ZeroTreasury() public {
        vm.prank(owner);
        vm.expectRevert(BoardingPass.TransferFailed.selector);
        pass.setTreasury(address(0));
    }

    function test_RevertWhen_ConstructorZeroTreasury() public {
        vm.expectRevert(BoardingPass.TransferFailed.selector);
        // forge-lint: disable-next-line(unsafe-typecast)
        new BoardingPass(address(vessel), uint16(MANIFEST_CRAFT_ID), address(0), owner);
    }

    function test_RevertWhen_RendererFrozen() public {
        address renderer = address(new MockRenderer());
        vm.startPrank(owner);
        pass.setRenderer(renderer);
        pass.freezeRenderer();
        vm.expectRevert(BoardingPass.RendererIsFrozen.selector);
        pass.setRenderer(makeAddr("otherRenderer"));
        vm.stopPrank();
    }

    function test_RevertWhen_SetVesselCraftIdWhileUnpaused() public {
        vm.prank(owner);
        vm.expectRevert(Pausable.ExpectedPause.selector);
        // forge-lint: disable-next-line(unsafe-typecast)
        pass.setVesselCraftId(uint16(OFFSET_CRAFT_ID));
    }

    function test_RevertWhen_SetVesselCraftIdFailsReadiness() public {
        vm.prank(owner);
        pass.pause();

        vessel.setVaultStatus(OFFSET_CRAFT_ID, false);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.VesselCraftNotVault.selector, OFFSET_CRAFT_ID));
        // forge-lint: disable-next-line(unsafe-typecast)
        pass.setVesselCraftId(uint16(OFFSET_CRAFT_ID));

        vessel.setVaultStatus(OFFSET_CRAFT_ID, true);
        vessel.setLocked(OFFSET_CRAFT_ID, true);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.VesselCraftLocked.selector, OFFSET_CRAFT_ID));
        // forge-lint: disable-next-line(unsafe-typecast)
        pass.setVesselCraftId(uint16(OFFSET_CRAFT_ID));

        vessel.setLocked(OFFSET_CRAFT_ID, false);
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(BoardingPass.VesselDelegateMismatch.selector, address(pass), address(0))
        );
        // forge-lint: disable-next-line(unsafe-typecast)
        pass.setVesselCraftId(uint16(OFFSET_CRAFT_ID));
    }

    function test_RevertWhen_RendererUnset() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        vm.expectRevert(BoardingPass.RendererUnset.selector);
        pass.tokenURI(SEAT_12A);
    }

    function test_RevertWhen_VesselEntryMismatch() public {
        NonIncrementingVessel weird = new NonIncrementingVessel();
        // forge-lint: disable-next-line(unsafe-typecast)
        BoardingPass other = new BoardingPass(address(weird), uint16(MANIFEST_CRAFT_ID), treasury, owner);
        weird.setDelegateForTest(address(other));

        uint256 price = other.quote(SEAT_12A, 0);
        vm.prank(traveler);
        vm.expectRevert(BoardingPass.VesselEntryMismatch.selector);
        other.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);
        vm.expectRevert(
            abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, uint256(SEAT_12A))
        );
        other.ownerOf(SEAT_12A);
    }

    function test_NameAndHandleBoundariesSucceed() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, _repeat("n", 48), DOB, _repeat("h", 32), 0);
        BoardingPassData memory data = pass.getBoardingPass(SEAT_12A);
        assertEq(bytes(data.fullName).length, 48);
        assertEq(bytes(data.twitterHandle).length, 32);
    }

    function test_EmptyHandleAllowed() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "", 0);
        assertEq(pass.getBoardingPass(SEAT_12A).twitterHandle, "");
    }

    function test_GetSeatAvailabilitySizedForCabin() public view {
        uint16[] memory ids = new uint16[](3);
        ids[0] = 11;
        ids[1] = SEAT_12A;
        ids[2] = 12;
        bool[] memory avail = pass.getSeatAvailability(ids);
        assertEq(avail.length, 3);
        assertTrue(avail[0]);
        assertTrue(avail[1]);
        assertFalse(avail[2]);
    }

    function _decodeDataUri(string memory uri, string memory prefix) private pure returns (string memory) {
        bytes memory raw = bytes(uri);
        bytes memory pre = bytes(prefix);
        require(raw.length > pre.length, "uri too short");
        for (uint256 i = 0; i < pre.length; i++) {
            require(raw[i] == pre[i], "prefix mismatch");
        }
        bytes memory b64 = new bytes(raw.length - pre.length);
        for (uint256 j = 0; j < b64.length; j++) {
            b64[j] = raw[pre.length + j];
        }
        return string(Base64.decode(string(b64)));
    }

    function _contains(string memory haystack, string memory needle) private pure returns (bool) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);
        if (n.length > h.length) return false;
        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool ok = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    ok = false;
                    break;
                }
            }
            if (ok) return true;
        }
        return false;
    }
}
