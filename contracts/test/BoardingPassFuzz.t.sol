// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BoardingPassFixture} from "./helpers/BoardingPassFixture.sol";
import {BoardingPass} from "../src/BoardingPass.sol";
import {BoardingPassData} from "../src/interfaces/IBoardingPass.sol";

contract BoardingPassFuzzTest is BoardingPassFixture {
    function testFuzz_SeatIdInvalidRevertsValidSucceeds(uint16 seatId) public {
        if (!pass.seatExists(seatId)) {
            vm.prank(traveler);
            vm.expectRevert(abi.encodeWithSelector(BoardingPass.InvalidSeat.selector, seatId));
            pass.bookAndMint{value: 0}(seatId, "Ada Lovelace", DOB, "ada", 0);
            return;
        }

        uint256 price = pass.quote(seatId, 0);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(seatId, "Ada Lovelace", DOB, "ada", 0);
        assertEq(pass.ownerOf(uint256(seatId)), traveler);
        assertEq(pass.getBoardingPass(uint256(seatId)).totalPaid, price);
    }

    function testFuzz_QuoteEqualsBasePlusSeatPlusBags(uint16 seatId, uint16 bagCount) public view {
        seatId = _nthValidSeat(seatId);
        assertEq(
            pass.quote(seatId, bagCount),
            pass.BASE_FARE() + pass.seatPrice(seatId) + pass.BAG_PRICE() * uint256(bagCount)
        );
    }

    function testFuzz_ExactPaymentOnly(uint16 seatSeed, uint16 bagCount, uint256 value) public {
        uint16 seatId = _nthValidSeat(seatSeed);
        uint256 price = pass.quote(seatId, bagCount);
        vm.assume(value != price);
        vm.deal(traveler, value);

        vm.prank(traveler);
        vm.expectRevert(abi.encodeWithSelector(BoardingPass.IncorrectPayment.selector, price, value));
        pass.bookAndMint{value: value}(seatId, "Ada Lovelace", DOB, "ada", bagCount);

        vm.deal(traveler, price);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(seatId, "Ada Lovelace", DOB, "ada", bagCount);
        assertEq(pass.getBoardingPass(uint256(seatId)).totalPaid, price);
    }

    function testFuzz_NameAndHandleRoundTrip(uint16 seatSeed, bytes memory nameRaw, bytes memory handleRaw)
        public
    {
        uint16 seatId = _nthValidSeat(seatSeed);
        string memory name = string(_clip(nameRaw, 64));
        string memory handle = string(_clip(handleRaw, 48));
        uint256 price = pass.quote(seatId, 0);
        uint256 nameLen = bytes(name).length;
        uint256 handleLen = bytes(handle).length;

        bool badName = nameLen == 0 || nameLen > pass.MAX_NAME_BYTES() || _hasControlChar(name);
        bool badHandle = handleLen > pass.MAX_HANDLE_BYTES() || _hasControlChar(handle)
            || (handleLen > 0 && bytes(handle)[0] == "@");

        if (badName) {
            vm.prank(traveler);
            vm.expectRevert(BoardingPass.InvalidName.selector);
            pass.bookAndMint{value: price}(seatId, name, DOB, handle, 0);
            return;
        }
        if (badHandle) {
            vm.prank(traveler);
            vm.expectRevert(BoardingPass.InvalidTwitterHandle.selector);
            pass.bookAndMint{value: price}(seatId, name, DOB, handle, 0);
            return;
        }

        vm.prank(traveler);
        pass.bookAndMint{value: price}(seatId, name, DOB, handle, 0);
        BoardingPassData memory data = pass.getBoardingPass(uint256(seatId));
        assertEq(data.fullName, name);
        assertEq(data.twitterHandle, handle);
        assertEq(data.seatId, seatId);
    }
}
