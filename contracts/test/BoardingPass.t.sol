// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {VesselFixture} from "./helpers/VesselFixture.sol";
import {BoardingPass} from "../src/BoardingPass.sol";
import {BoardingPassData} from "../src/interfaces/IBoardingPass.sol";
import {IVessel} from "../src/interfaces/IVessel.sol";
import {MockVessel} from "../src/mocks/MockVessel.sol";

/// @dev Same ABI layout as the frozen `abi.encode` tuple in `BoardingPass._buildManifest`.
struct ManifestV1 {
    bytes4 magic;
    uint8 version;
    address issuer;
    uint256 expectedEntry;
    uint16 seatId;
    address traveler;
    string fullName;
    uint32 dateOfBirth;
    string twitterHandle;
    uint16 bagCount;
    uint256 totalPaid;
    uint256 timestamp;
    string origin;
    string destination;
    string trip;
    string departure;
    string flight;
}

contract ManifestDecoder {
    function decode(bytes calldata payload) external pure returns (ManifestV1 memory m) {
        (
            m.magic,
            m.version,
            m.issuer,
            m.expectedEntry,
            m.seatId,
            m.traveler,
            m.fullName,
            m.dateOfBirth,
            m.twitterHandle,
            m.bagCount,
            m.totalPaid,
            m.timestamp,
            m.origin,
            m.destination,
            m.trip,
            m.departure,
            m.flight
        ) =
            abi.decode(
                payload,
                (
                    bytes4,
                    uint8,
                    address,
                    uint256,
                    uint16,
                    address,
                    string,
                    uint32,
                    string,
                    uint16,
                    uint256,
                    uint256,
                    string,
                    string,
                    string,
                    string,
                    string
                )
            );
    }
}

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

contract BoardingPassTest is VesselFixture {
    uint16 internal constant SEAT_12A = 121;
    uint32 internal constant DOB = 19980512;

    BoardingPass internal pass;
    address internal owner;
    address internal treasury;
    address internal traveler;

    function setUp() public override {
        super.setUp();
        owner = makeAddr("owner");
        treasury = makeAddr("treasury");
        traveler = makeAddr("traveler");
        vm.deal(traveler, 100 ether);

        // MANIFEST_CRAFT_ID is 6669, which fits uint16.
        // forge-lint: disable-next-line(unsafe-typecast)
        pass = new BoardingPass(address(vessel), uint16(MANIFEST_CRAFT_ID), treasury, owner);
        vm.prank(craftOwner);
        vessel.setDelegate(MANIFEST_CRAFT_ID, address(pass));
    }

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

    function test_ManifestPayloadDecodesAndRoundTrips() public {
        uint16 bags = 2;
        uint256 price = pass.quote(SEAT_12A, bags);
        uint256 t0 = 1_800_000_000;
        vm.warp(t0);

        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", bags);

        bytes memory payload = vessel.vaultToEntry(MANIFEST_CRAFT_ID, 1);
        ManifestV1 memory m = new ManifestDecoder().decode(payload);

        assertEq(m.magic, pass.MANIFEST_MAGIC());
        assertEq(m.version, pass.MANIFEST_VERSION());
        assertEq(m.issuer, address(pass));
        assertEq(m.expectedEntry, 1);
        assertEq(m.seatId, SEAT_12A);
        assertEq(m.traveler, traveler);
        assertEq(m.fullName, "Ada Lovelace");
        assertEq(m.dateOfBirth, DOB);
        assertEq(m.twitterHandle, "ada");
        assertEq(m.bagCount, bags);
        assertEq(m.totalPaid, price);
        assertEq(m.timestamp, t0);
        assertEq(m.origin, "Current Location");
        assertEq(m.destination, "Ethereum");
        assertEq(m.trip, "Round Trip");
        assertEq(m.departure, "Now");
        assertEq(m.flight, "ETH001");
        assertEq(pass.vesselPayloadFor(SEAT_12A), payload);
    }

    function test_RevertWhen_IncorrectPaymentOverAndUnder() public {
        uint256 price = pass.quote(SEAT_12A, 0);

        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.IncorrectPayment.selector, price, price - 1));
        pass.bookAndMint{value: price - 1}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.IncorrectPayment.selector, price, price + 1));
        pass.bookAndMint{value: price + 1}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        _assertUnminted(SEAT_12A, price);
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

    function test_RevertWhen_VesselWriteFailureRollsBack() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        uint256 travelerBefore = traveler.balance;
        vessel.forceWriteFailure(true);

        vm.prank(traveler);
        vm.expectRevert(MockVessel.MockVesselWriteForcedFailure.selector);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        _assertUnminted(SEAT_12A, price);
        assertEq(traveler.balance, travelerBefore);
    }

    function test_RevertWhen_InvalidSeat() public {
        uint16 missing = 12; // 1B
        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.InvalidSeat.selector, missing));
        pass.bookAndMint{value: 1 ether}(missing, "Ada Lovelace", DOB, "ada", 0);
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
    }

    function test_RevertWhen_VesselCraftNotVault() public {
        vessel.setVaultStatus(MANIFEST_CRAFT_ID, false);
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.VesselCraftNotVault.selector, MANIFEST_CRAFT_ID));
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);
        _assertUnminted(SEAT_12A, price);
    }

    function test_RevertWhen_VesselCraftLocked() public {
        vessel.setLocked(MANIFEST_CRAFT_ID, true);
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.VesselCraftLocked.selector, MANIFEST_CRAFT_ID));
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);
        _assertUnminted(SEAT_12A, price);
    }

    function test_RevertWhen_VesselDelegateMismatch() public {
        vm.prank(craftOwner);
        vessel.setDelegate(MANIFEST_CRAFT_ID, address(0));
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        vm.expectRevert(
            abi.encodeWithSelector(BoardingPass.VesselDelegateMismatch.selector, address(pass), address(0))
        );
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);
        _assertUnminted(SEAT_12A, price);
    }

    function test_RevertWhen_VesselPayloadTooLarge() public {
        vm.prank(craftOwner);
        vessel.setDelegate(SMALL_CRAFT_ID, address(pass));
        vm.startPrank(owner);
        pass.pause();
        // SMALL_CRAFT_ID is 64, which fits uint16.
        // forge-lint: disable-next-line(unsafe-typecast)
        pass.setVesselCraftId(uint16(SMALL_CRAFT_ID));
        pass.unpause();
        vm.stopPrank();

        uint256 price = pass.quote(SEAT_12A, 0);
        bytes memory sample = _samplePayload(1);
        vm.prank(traveler);
        vm.expectRevert(
            abi.encodeWithSelector(BoardingPass.VesselPayloadTooLarge.selector, sample.length, SMALL_CRAFT_ID)
        );
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);
        _assertUnminted(SEAT_12A, price);
        assertEq(vessel.craftToEntry(SMALL_CRAFT_ID), 0);
    }

    function test_RevertWhen_VesselEntryMismatch() public {
        NonIncrementingVessel weird = new NonIncrementingVessel();
        // MANIFEST_CRAFT_ID is 6669, which fits uint16.
        // forge-lint: disable-next-line(unsafe-typecast)
        BoardingPass other = new BoardingPass(address(weird), uint16(MANIFEST_CRAFT_ID), treasury, owner);
        weird.setDelegateForTest(address(other));

        uint256 price = other.quote(SEAT_12A, 0);
        vm.prank(traveler);
        vm.expectRevert(BoardingPass.VesselEntryMismatch.selector);
        other.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);
        assertEq(other.balanceOf(traveler), 0);
    }

    function test_RevertWhen_RendererUnset() public {
        uint256 price = pass.quote(SEAT_12A, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        vm.expectRevert(BoardingPass.RendererUnset.selector);
        pass.tokenURI(SEAT_12A);
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

        BoardingPassData memory data = pass.getBoardingPass(SEAT_12A);
        assertEq(data.traveler, traveler);
        assertEq(pass.tokenURI(SEAT_12A), "data:application/json,{\"id\":121}");
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

    function test_QuoteMatchesBasePlusSeatPlusBags() public view {
        assertEq(pass.quote(SEAT_12A, 0), pass.BASE_FARE() + pass.seatPrice(SEAT_12A));
        assertEq(pass.quote(SEAT_12A, 3), pass.BASE_FARE() + pass.seatPrice(SEAT_12A) + pass.BAG_PRICE() * 3);
        assertEq(pass.seatLabel(SEAT_12A), "12A");
        assertTrue(pass.seatExists(SEAT_12A));
        assertFalse(pass.seatExists(12));
    }

    function test_GetSeatAvailabilitySizedForCabin() public view {
        uint16[] memory ids = new uint16[](3);
        ids[0] = 11; // 1A
        ids[1] = SEAT_12A;
        ids[2] = 12; // invalid
        bool[] memory avail = pass.getSeatAvailability(ids);
        assertEq(avail.length, 3);
        assertTrue(avail[0]);
        assertTrue(avail[1]);
        assertFalse(avail[2]);
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

    function _assertUnminted(
        uint16 seatId,
        uint256 /* price */
    )
        internal
        view
    {
        assertTrue(pass.isSeatAvailable(seatId));
        assertEq(pass.balanceOf(traveler), 0);
        assertEq(address(pass).balance, 0);
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 0);
    }

    function _repeat(string memory ch, uint256 n) internal pure returns (string memory) {
        bytes memory one = bytes(ch);
        bytes memory out = new bytes(n);
        for (uint256 i = 0; i < n; i++) {
            out[i] = one[0];
        }
        return string(out);
    }

    function _samplePayload(uint256 expectedEntry) internal view returns (bytes memory) {
        return abi.encode(
            pass.MANIFEST_MAGIC(),
            pass.MANIFEST_VERSION(),
            address(pass),
            expectedEntry,
            SEAT_12A,
            traveler,
            "Ada Lovelace",
            DOB,
            "ada",
            uint16(0),
            pass.quote(SEAT_12A, 0),
            block.timestamp,
            pass.ORIGIN(),
            pass.DESTINATION(),
            pass.TRIP(),
            pass.DEPARTURE(),
            pass.FLIGHT()
        );
    }
}
