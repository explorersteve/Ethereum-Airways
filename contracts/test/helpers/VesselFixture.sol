// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MockVessel} from "../../src/mocks/MockVessel.sol";

/// @dev Shared MockVessel setup mirroring production crafts.
///      Manifest capacity is 6669 (tighter of mainnet 6669 and Sepolia 6675).
abstract contract VesselFixture is Test {
    uint256 internal constant MANIFEST_CRAFT_ID = 6669;
    uint256 internal constant SMALL_CRAFT_ID = 64;
    uint256 internal constant OFFSET_CRAFT_ID = 6675;
    uint256 internal constant OFFSET_STARTING_ENTRY = 7;

    MockVessel internal vessel;
    address internal craftOwner;

    function setUp() public virtual {
        craftOwner = makeAddr("craftOwner");
        vessel = new MockVessel();

        vessel.claimForTest(MANIFEST_CRAFT_ID, craftOwner, true);
        vessel.claimForTest(SMALL_CRAFT_ID, craftOwner, true);
        vessel.claimForTest(OFFSET_CRAFT_ID, craftOwner, true);
        vessel.setEntryForTest(OFFSET_CRAFT_ID, OFFSET_STARTING_ENTRY);
    }
}
