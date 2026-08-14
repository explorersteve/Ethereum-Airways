// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BoardingPassFixture} from "./helpers/BoardingPassFixture.sol";

contract BoardingPassPricingTest is BoardingPassFixture {
    function test_BriefSection83PricesThroughContract() public view {
        assertEq(pass.seatPrice(11), 0.06 ether); // 1A
        assertEq(pass.seatPrice(46), 0.045 ether); // 4F
        assertEq(pass.seatPrice(51), 0.03 ether); // 5A
        assertEq(pass.seatPrice(95), 0.022 ether); // 9E
        assertEq(pass.seatPrice(101), 0.018 ether); // 10A
        assertEq(pass.seatPrice(116), 0.016 ether); // 11F
        assertEq(pass.seatPrice(121), 0.009 ether); // 12A
        assertEq(pass.seatPrice(122), 0.006 ether); // 12B
        assertEq(pass.seatPrice(243), 0.003 ether); // 24C
        assertEq(pass.seatPrice(245), 0.002 ether); // 24E
        assertEq(pass.seatPrice(251), 0.001 ether); // 25A
        assertEq(pass.seatPrice(326), 0.00016 ether); // 32F
        assertEq(pass.seatPrice(325), 0.00008 ether); // 32E
    }

    function test_QuoteArithmeticIncludingMaxBags() public view {
        uint256 base = pass.BASE_FARE();
        uint256 bag = pass.BAG_PRICE();
        uint256 seat = pass.seatPrice(SEAT_12A);

        assertEq(pass.quote(SEAT_12A, 0), base + seat);
        assertEq(pass.quote(SEAT_12A, 1), base + seat + bag);
        assertEq(pass.quote(SEAT_12A, 3), base + seat + bag * 3);
        assertEq(pass.quote(SEAT_12A, type(uint16).max), base + seat + bag * uint256(type(uint16).max));
        assertEq(
            pass.quote(11, type(uint16).max), base + pass.seatPrice(11) + bag * uint256(type(uint16).max)
        );
        assertEq(pass.quote(325, 0), base + pass.seatPrice(325));
    }
}
