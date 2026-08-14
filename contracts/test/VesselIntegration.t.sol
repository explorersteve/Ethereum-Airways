// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

import {BoardingPassFixture} from "./helpers/BoardingPassFixture.sol";
import {BoardingPass} from "../src/BoardingPass.sol";
import {MockVessel} from "../src/mocks/MockVessel.sol";

/// @dev Brief §87: each Vessel failure rolls back seat, token, balances, and entry.
contract VesselIntegrationTest is BoardingPassFixture {
    function test_RevertWhen_NotAVault_RollsBackFully() public {
        vessel.setVaultStatus(MANIFEST_CRAFT_ID, false);
        _expectFullRollback(
            abi.encodeWithSelector(BoardingPass.VesselCraftNotVault.selector, MANIFEST_CRAFT_ID)
        );
    }

    function test_RevertWhen_LockedCraft_RollsBackFully() public {
        vessel.setLocked(MANIFEST_CRAFT_ID, true);
        _expectFullRollback(
            abi.encodeWithSelector(BoardingPass.VesselCraftLocked.selector, MANIFEST_CRAFT_ID)
        );
    }

    function test_RevertWhen_DelegateRevoked_RollsBackFully() public {
        vm.prank(craftOwner);
        vessel.setDelegate(MANIFEST_CRAFT_ID, address(0));
        _expectFullRollback(
            abi.encodeWithSelector(BoardingPass.VesselDelegateMismatch.selector, address(pass), address(0))
        );
    }

    function test_RevertWhen_PayloadLargerThanCapacity_RollsBackFully() public {
        vm.prank(craftOwner);
        vessel.setDelegate(SMALL_CRAFT_ID, address(pass));
        vm.startPrank(owner);
        pass.pause();
        // forge-lint: disable-next-line(unsafe-typecast)
        pass.setVesselCraftId(uint16(SMALL_CRAFT_ID));
        pass.unpause();
        vm.stopPrank();

        bytes memory sample = _samplePayload(1, SEAT_12A, traveler, 0);
        uint256 price = pass.quote(SEAT_12A, 0);
        uint256 buyerBefore = traveler.balance;
        uint256 contractBefore = address(pass).balance;
        uint256 smallEntry = vessel.craftToEntry(SMALL_CRAFT_ID);
        uint256 manifestEntry = vessel.craftToEntry(MANIFEST_CRAFT_ID);

        vm.prank(traveler);
        vm.expectRevert(
            abi.encodeWithSelector(BoardingPass.VesselPayloadTooLarge.selector, sample.length, SMALL_CRAFT_ID)
        );
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        _assertUnminted(SEAT_12A);
        assertEq(address(pass).balance, contractBefore);
        assertEq(vessel.craftToEntry(SMALL_CRAFT_ID), smallEntry);
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), manifestEntry);
        assertEq(traveler.balance, buyerBefore);
    }

    function test_RevertWhen_ForceWriteFailure_RollsBackFully() public {
        vessel.forceWriteFailure(true);
        _expectFullRollback(abi.encodeWithSelector(MockVessel.MockVesselWriteForcedFailure.selector));
    }

    function _expectFullRollback(bytes memory revertData) internal {
        uint256 price = pass.quote(SEAT_12A, 0);
        uint256 buyerBefore = traveler.balance;
        uint256 contractBefore = address(pass).balance;
        uint256 entryBefore = vessel.craftToEntry(MANIFEST_CRAFT_ID);

        vm.prank(traveler);
        vm.expectRevert(revertData);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        _assertUnminted(SEAT_12A);
        assertEq(address(pass).balance, contractBefore);
        assertEq(vessel.craftToEntry(MANIFEST_CRAFT_ID), entryBefore);
        // Foundry default tx gas price is 0, so the buyer is unchanged except the reverted value.
        assertEq(traveler.balance, buyerBefore);
    }

    function _assertUnminted(uint16 seatId) internal {
        assertTrue(pass.isSeatAvailable(seatId));
        vm.expectRevert(
            abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, uint256(seatId))
        );
        this.ownerOfExternal(seatId);
        assertEq(pass.balanceOf(traveler), 0);
    }

    function ownerOfExternal(uint16 seatId) external view returns (address) {
        return pass.ownerOf(uint256(seatId));
    }
}
