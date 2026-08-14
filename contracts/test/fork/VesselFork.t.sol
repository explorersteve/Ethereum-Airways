// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";

import {BoardingPass} from "../../src/BoardingPass.sol";
import {IVessel} from "../../src/interfaces/IVessel.sol";

/// @dev Fork-only. Skipped when `SEPOLIA_RPC_URL` / `ETHEREUM_RPC_URL` (or `SEPOLIA_RPC` /
///      `MAINNET_RPC`) are unset. Never uses a real private key — `vm.prank` only.
contract VesselForkTest is Test {
    address internal constant VESSEL_MAINNET = 0xECb92Cc7112b80A2234936315BbB493fb48d1463;
    address internal constant VESSEL_SEPOLIA = 0x1bbf5064e2238d9C9D993A6Bc15aE86e6f2f57eC;
    uint256 internal constant CRAFT_MAINNET = 6669;
    uint256 internal constant CRAFT_SEPOLIA = 6675;
    uint16 internal constant CRAFT_MAINNET_U16 = 6669;
    uint16 internal constant CRAFT_SEPOLIA_U16 = 6675;
    address internal constant MAINNET_OPERATOR = 0xCcf0a1307E5e5Ad04E85d94d7f9D400390F0118a;

    uint32 internal constant DOB = 19980512;
    uint16 internal constant SEAT_12A = 121;

    function test_SepoliaCraft6675IsWritableVaultWithCapacity() public {
        string memory url = _rpc("SEPOLIA_RPC_URL", "SEPOLIA_RPC");
        if (bytes(url).length == 0) {
            vm.skip(true);
            return;
        }
        vm.createSelectFork(url);

        IVessel vessel = IVessel(VESSEL_SEPOLIA);
        assertTrue(vessel.craftToVaultStatus(CRAFT_SEPOLIA), "6675 must be a Vault");
        assertFalse(vessel.craftToLocked(CRAFT_SEPOLIA), "6675 must be unlocked");
        uint256 entry = vessel.craftToEntry(CRAFT_SEPOLIA);
        address delegate = vessel.craftToDelegate(CRAFT_SEPOLIA);
        emit log_named_uint("sepolia craftToEntry", entry);
        emit log_named_address("sepolia craftToDelegate", delegate);

        try vessel.ownerOf(CRAFT_SEPOLIA) returns (address owner_) {
            emit log_named_address("sepolia ownerOf(6675)", owner_);
        } catch {
            emit log_string("sepolia ownerOf(6675) reverted - craft not yet claimed");
        }

        uint256 payloadLen = _sampleManifestLength(vessel, CRAFT_SEPOLIA_U16, entry + 1);
        emit log_named_uint("sample manifest payload bytes", payloadLen);
        assertLt(payloadLen, CRAFT_SEPOLIA, "capacity 6675 must exceed encoded manifest");
    }

    function test_MainnetCraft6669IsVaultUnlockedOwnedByOperator() public {
        string memory url = _rpc("ETHEREUM_RPC_URL", "MAINNET_RPC");
        if (bytes(url).length == 0) {
            vm.skip(true);
            return;
        }
        vm.createSelectFork(url);

        IVessel vessel = IVessel(VESSEL_MAINNET);
        assertTrue(vessel.craftToVaultStatus(CRAFT_MAINNET), "6669 must be a Vault");
        assertFalse(vessel.craftToLocked(CRAFT_MAINNET), "6669 must be unlocked");
        assertEq(vessel.ownerOf(CRAFT_MAINNET), MAINNET_OPERATOR);
        uint256 entry = vessel.craftToEntry(CRAFT_MAINNET);
        emit log_named_uint("mainnet craftToEntry", entry);
        emit log_named_address("mainnet craftToDelegate", vessel.craftToDelegate(CRAFT_MAINNET));

        uint256 payloadLen = _sampleManifestLength(vessel, CRAFT_MAINNET_U16, entry + 1);
        emit log_named_uint("sample manifest payload bytes", payloadLen);
        assertLt(payloadLen, CRAFT_MAINNET, "capacity 6669 must exceed encoded manifest");
    }

    function test_ForkWriteViaPrankedMainnetOwner() public {
        string memory url = _rpc("ETHEREUM_RPC_URL", "MAINNET_RPC");
        if (bytes(url).length == 0) {
            vm.skip(true);
            return;
        }
        vm.createSelectFork(url);

        IVessel vessel = IVessel(VESSEL_MAINNET);
        address treasury = makeAddr("treasury");
        address owner = makeAddr("owner");
        address traveler = makeAddr("traveler");

        BoardingPass pass = new BoardingPass(VESSEL_MAINNET, CRAFT_MAINNET_U16, treasury, owner);
        uint256 entryBefore = vessel.craftToEntry(CRAFT_MAINNET);

        vm.prank(MAINNET_OPERATOR);
        vessel.setDelegate(CRAFT_MAINNET, address(pass));
        assertEq(vessel.craftToDelegate(CRAFT_MAINNET), address(pass));

        uint256 price = pass.quote(SEAT_12A, 0);
        vm.deal(traveler, price);
        vm.prank(traveler);
        pass.bookAndMint{value: price}(SEAT_12A, "Ada Lovelace", DOB, "ada", 0);

        assertEq(pass.ownerOf(SEAT_12A), traveler);
        assertEq(vessel.craftToEntry(CRAFT_MAINNET), entryBefore + 1);
        // Production `vaultToEntry` is 0-based (`payloadList[tokenId][entry]`);
        // `craftToEntry` is the 1-based count. First write lives at index `entryBefore`.
        bytes memory stored = vessel.vaultToEntry(CRAFT_MAINNET, entryBefore);
        assertEq(pass.vesselPayloadFor(SEAT_12A), stored);
        emit log_named_uint("fork write manifest payload bytes", stored.length);
    }

    function _sampleManifestLength(IVessel vessel, uint16 craftId, uint256 expectedEntry)
        internal
        returns (uint256)
    {
        address treasury = makeAddr("lenTreasury");
        address owner = makeAddr("lenOwner");
        BoardingPass pass = new BoardingPass(address(vessel), craftId, treasury, owner);
        bytes memory payload = abi.encode(
            pass.MANIFEST_MAGIC(),
            pass.MANIFEST_VERSION(),
            address(pass),
            expectedEntry,
            SEAT_12A,
            makeAddr("lenTraveler"),
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
        return payload.length;
    }

    function _rpc(string memory primary, string memory fallbackName) internal view returns (string memory) {
        string memory url = vm.envOr(primary, string(""));
        if (bytes(url).length > 0) return url;
        return vm.envOr(fallbackName, string(""));
    }
}
