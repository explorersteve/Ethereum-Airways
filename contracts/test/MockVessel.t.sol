// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VesselFixture} from "./helpers/VesselFixture.sol";
import {MockVessel} from "../src/mocks/MockVessel.sol";

contract MockVesselTest is VesselFixture {
    function test_FixtureManifestCraftMatchesProductionShape() public view {
        assertTrue(vessel.craftToClaimed(MANIFEST_CRAFT_ID));
        assertTrue(vessel.craftToVaultStatus(MANIFEST_CRAFT_ID));
        assertFalse(vessel.craftToLocked(MANIFEST_CRAFT_ID));
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 0);
        assertEq(vessel.craftToDelegate(MANIFEST_CRAFT_ID), address(0));
        assertEq(vessel.ownerOf(MANIFEST_CRAFT_ID), craftOwner);
    }

    function test_FixtureSmallCraftAndNonZeroEntryCraft() public view {
        assertTrue(vessel.craftToVaultStatus(SMALL_CRAFT_ID));
        assertEq(vessel.craftToEntry(SMALL_CRAFT_ID), 0);
        assertTrue(vessel.craftToVaultStatus(OFFSET_CRAFT_ID));
        assertEq(vessel.craftToEntry(OFFSET_CRAFT_ID), OFFSET_STARTING_ENTRY);
    }

    function test_PayloadExactlyAtCapacitySucceeds() public {
        bytes memory payload = new bytes(MANIFEST_CRAFT_ID);
        payload[0] = 0xab;
        payload[MANIFEST_CRAFT_ID - 1] = 0xcd;

        vm.prank(craftOwner);
        vessel.setPayloadHolder(MANIFEST_CRAFT_ID, payload);

        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 1);
        assertEq(vessel.vaultToEntry(MANIFEST_CRAFT_ID, 1), payload);
        assertEq(vessel.payloadAt(MANIFEST_CRAFT_ID, 1), payload);
    }

    function test_RevertWhen_CapacityPlusOne() public {
        bytes memory payload = new bytes(MANIFEST_CRAFT_ID + 1);

        vm.prank(craftOwner);
        vm.expectRevert(
            abi.encodeWithSelector(
                MockVessel.MockVesselPayloadTooLarge.selector, MANIFEST_CRAFT_ID + 1, MANIFEST_CRAFT_ID
            )
        );
        vessel.setPayloadHolder(MANIFEST_CRAFT_ID, payload);
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 0);
    }

    function test_SmallCraftCapacityPlusOneReverts() public {
        bytes memory payload = new bytes(SMALL_CRAFT_ID + 1);

        vm.prank(craftOwner);
        vm.expectRevert(
            abi.encodeWithSelector(
                MockVessel.MockVesselPayloadTooLarge.selector, SMALL_CRAFT_ID + 1, SMALL_CRAFT_ID
            )
        );
        vessel.setPayloadHolder(SMALL_CRAFT_ID, payload);
    }

    function test_RevertWhen_NonDelegate() public {
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(MockVessel.MockVesselUnauthorized.selector);
        vessel.setPayloadHolder(MANIFEST_CRAFT_ID, hex"01");
    }

    function test_DelegateCanWrite() public {
        address delegate = makeAddr("delegate");
        vm.prank(craftOwner);
        vessel.setDelegate(MANIFEST_CRAFT_ID, delegate);

        bytes memory payload = hex"11";
        vm.prank(delegate);
        vessel.setPayloadHolder(MANIFEST_CRAFT_ID, payload);

        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 1);
        assertEq(vessel.vaultToEntry(MANIFEST_CRAFT_ID, 1), payload);
    }

    function test_RevertWhen_Locked() public {
        vessel.setLocked(MANIFEST_CRAFT_ID, true);
        vm.prank(craftOwner);
        vm.expectRevert(MockVessel.MockVesselLocked.selector);
        vessel.setPayloadHolder(MANIFEST_CRAFT_ID, hex"01");
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 0);
    }

    function test_RevertWhen_UnclaimedCraft() public {
        vm.prank(craftOwner);
        vm.expectRevert(abi.encodeWithSelector(MockVessel.MockVesselNonexistent.selector, uint256(1)));
        vessel.setPayloadHolder(1, hex"01");
    }

    function test_VaultAppendsIncrementEntry() public {
        vm.startPrank(craftOwner);
        vessel.setPayloadHolder(MANIFEST_CRAFT_ID, hex"01");
        vessel.setPayloadHolder(MANIFEST_CRAFT_ID, hex"02");
        vm.stopPrank();

        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 2);
        assertEq(vessel.vaultToEntry(MANIFEST_CRAFT_ID, 1), hex"01");
        assertEq(vessel.vaultToEntry(MANIFEST_CRAFT_ID, 2), hex"02");
    }

    function test_VaultAppendFromNonZeroStartingEntry() public {
        bytes memory payload = hex"aa";
        uint256 before = vessel.craftToEntry(OFFSET_CRAFT_ID);

        vm.prank(craftOwner);
        vessel.setPayloadHolder(OFFSET_CRAFT_ID, payload);

        assertEq(before, OFFSET_STARTING_ENTRY);
        assertEq(vessel.craftToEntry(OFFSET_CRAFT_ID), OFFSET_STARTING_ENTRY + 1);
        assertEq(vessel.vaultToEntry(OFFSET_CRAFT_ID, OFFSET_STARTING_ENTRY + 1), payload);
    }

    function test_CapsuleReplaceDoesNotIncrement() public {
        uint256 capsuleId = 100;
        vessel.claimForTest(capsuleId, craftOwner, false);
        assertFalse(vessel.craftToVaultStatus(capsuleId));

        vm.startPrank(craftOwner);
        vessel.setPayloadHolder(capsuleId, hex"01");
        vessel.setPayloadHolder(capsuleId, hex"02");
        vm.stopPrank();

        assertEq(vessel.craftToEntry(capsuleId), 0);
        assertEq(vessel.vaultToEntry(capsuleId, 0), hex"02");
        assertEq(vessel.payloadAt(capsuleId, 0), hex"02");
    }

    function test_RevertWhen_NonOwnerSetDelegate() public {
        vm.prank(makeAddr("stranger"));
        vm.expectRevert(MockVessel.MockVesselNotOwner.selector);
        vessel.setDelegate(MANIFEST_CRAFT_ID, makeAddr("delegate"));
    }

    function test_ForceWriteFailureStaysArmedUntilCleared() public {
        vessel.forceWriteFailure(true);

        vm.prank(craftOwner);
        vm.expectRevert(MockVessel.MockVesselWriteForcedFailure.selector);
        vessel.setPayloadHolder(MANIFEST_CRAFT_ID, hex"01");
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 0);

        vessel.forceWriteFailure(false);

        vm.prank(craftOwner);
        vessel.setPayloadHolder(MANIFEST_CRAFT_ID, hex"01");
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), 1);
    }
}
