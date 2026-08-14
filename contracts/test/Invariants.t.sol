// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";

import {BoardingPassFixture} from "./helpers/BoardingPassFixture.sol";
import {BoardingPass} from "../src/BoardingPass.sol";
import {BoardingPassData} from "../src/interfaces/IBoardingPass.sol";
import {MockVessel} from "../src/mocks/MockVessel.sol";
import {SeatLib} from "../src/libraries/SeatLib.sol";

contract BookingHandler is Test {
    BoardingPass public immutable pass;
    MockVessel public immutable vessel;
    address public immutable owner;
    uint256 public immutable craftId;

    uint16[] public mintedSeats;
    mapping(uint16 => bool) public minted;
    uint256 public mintCount;
    uint256 public sumPaid;
    uint256 public sumWithdrawn;

    address[] internal _actors;
    uint32 internal constant DOB = 19980512;

    constructor(BoardingPass pass_, MockVessel vessel_, address owner_, uint256 craftId_) {
        pass = pass_;
        vessel = vessel_;
        owner = owner_;
        craftId = craftId_;
        _actors.push(address(uint160(uint256(keccak256("actor-1")))));
        _actors.push(address(uint160(uint256(keccak256("actor-2")))));
        _actors.push(address(uint160(uint256(keccak256("actor-3")))));
        _actors.push(address(uint160(uint256(keccak256("actor-4")))));
    }

    function book(uint256 actorSeed, uint16 seatSeed, uint16 bags) external {
        address actor = _actors[actorSeed % _actors.length];
        uint16 seatId = _nthValidSeat(seatSeed);
        if (!pass.isSeatAvailable(seatId)) return;

        uint256 price = pass.quote(seatId, bags);
        vm.deal(actor, price);
        vm.prank(actor);
        pass.bookAndMint{value: price}(seatId, "Ada Lovelace", DOB, "ada", bags);

        minted[seatId] = true;
        mintedSeats.push(seatId);
        mintCount++;
        sumPaid += price;
    }

    function withdraw() external {
        uint256 bal = address(pass).balance;
        if (bal == 0) return;
        vm.prank(owner);
        pass.withdraw();
        sumWithdrawn += bal;
    }

    function mintedSeatAt(uint256 i) external view returns (uint16) {
        return mintedSeats[i];
    }

    function mintedSeatCount() external view returns (uint256) {
        return mintedSeats.length;
    }

    function _nthValidSeat(uint256 n) internal pure returns (uint16) {
        uint256 want = n % 184;
        uint256 seen;
        for (uint16 seatId = 0; seatId < 1000; seatId++) {
            if (!SeatLib.exists(seatId)) continue;
            if (seen == want) return seatId;
            seen++;
        }
        revert("no valid seat");
    }
}

contract InvariantsTest is StdInvariant, BoardingPassFixture {
    BookingHandler internal handler;

    function setUp() public override {
        super.setUp();
        handler = new BookingHandler(pass, vessel, owner, MANIFEST_CRAFT_ID);
        targetContract(address(handler));
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = BookingHandler.book.selector;
        selectors[1] = BookingHandler.withdraw.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
    }

    function invariant_SeatNeverMintsTwice() public view {
        uint256 n = handler.mintedSeatCount();
        for (uint256 i = 0; i < n; i++) {
            uint16 seatId = handler.mintedSeatAt(i);
            assertTrue(handler.minted(seatId));
            assertFalse(pass.isSeatAvailable(seatId));
            assertEq(pass.getBoardingPass(uint256(seatId)).seatId, seatId);
        }
    }

    function invariant_TokenIdEqualsStoredSeatId() public view {
        uint256 n = handler.mintedSeatCount();
        for (uint256 i = 0; i < n; i++) {
            uint16 seatId = handler.mintedSeatAt(i);
            BoardingPassData memory data = pass.getBoardingPass(uint256(seatId));
            assertEq(data.seatId, seatId);
            assertEq(pass.ownerOf(uint256(seatId)) != address(0), true);
        }
    }

    function invariant_TotalPaidEqualsQuoteAtMint() public view {
        uint256 n = handler.mintedSeatCount();
        for (uint256 i = 0; i < n; i++) {
            uint16 seatId = handler.mintedSeatAt(i);
            BoardingPassData memory data = pass.getBoardingPass(uint256(seatId));
            assertEq(data.totalPaid, pass.quote(data.seatId, data.bagCount));
        }
    }

    function invariant_VesselLinkageAndEntriesIncrease() public view {
        uint256 n = handler.mintCount();
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), n);
        for (uint256 i = 0; i < n; i++) {
            uint16 seatId = handler.mintedSeatAt(i);
            BoardingPassData memory data = pass.getBoardingPass(uint256(seatId));
            assertTrue(data.vesselCraftId != 0);
            assertTrue(data.vesselEntry != 0);
            assertEq(data.vesselCraftId, MANIFEST_CRAFT_ID);
        }
        _assertEntriesUniqueAndBounded(n);
    }

    function invariant_BalanceEqualsPaidMinusWithdrawals() public view {
        assertEq(address(pass).balance, handler.sumPaid() - handler.sumWithdrawn());
    }

    function _assertEntriesUniqueAndBounded(uint256 n) internal view {
        for (uint256 i = 0; i < n; i++) {
            uint256 entryI = pass.getBoardingPass(uint256(handler.mintedSeatAt(i))).vesselEntry;
            assertLe(entryI, n);
            for (uint256 j = i + 1; j < n; j++) {
                uint256 entryJ = pass.getBoardingPass(uint256(handler.mintedSeatAt(j))).vesselEntry;
                assertTrue(entryI != entryJ);
            }
        }
    }
}
