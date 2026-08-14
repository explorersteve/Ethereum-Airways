// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVessel} from "../interfaces/IVessel.sol";

/// @title Production-faithful Vessel mock for local atomicity tests.
/// @dev Errors are `MockVessel*` so they cannot be confused with BoardingPass reverts.
///      Vault writes append and increment `craftToEntry`. Capsule writes replace slot 0
///      and do not increment. Capacity is `payload.length <= tokenId`.
contract MockVessel is IVessel {
    error MockVesselNonexistent(uint256 tokenId);
    error MockVesselUnauthorized();
    error MockVesselNotOwner();
    error MockVesselLocked();
    error MockVesselPayloadTooLarge(uint256 length, uint256 capacity);
    error MockVesselWriteForcedFailure();

    mapping(uint256 => bool) public override craftToClaimed;
    mapping(uint256 => bool) public override craftToVaultStatus;
    mapping(uint256 => bool) public override craftToLocked;
    mapping(uint256 => address) public override craftToDelegate;
    mapping(uint256 => uint256) public override craftToEntry;

    mapping(uint256 => address) private _owners;
    mapping(uint256 => mapping(uint256 => bytes)) private _payloads;
    bool private _forceWriteFailure;

    /// @notice Test setter: mark a craft claimed/owned and set Capsule vs Vault.
    function claimForTest(uint256 tokenId, address to, bool isVault) external {
        craftToClaimed[tokenId] = true;
        _owners[tokenId] = to;
        craftToVaultStatus[tokenId] = isVault;
        craftToLocked[tokenId] = false;
    }

    function setLocked(uint256 tokenId, bool locked) external {
        craftToLocked[tokenId] = locked;
    }

    function setVaultStatus(uint256 tokenId, bool isVault) external {
        craftToVaultStatus[tokenId] = isVault;
    }

    /// @notice Sticky test knob: while armed, `setPayloadHolder` reverts.
    ///         A revert cannot clear this flag (EVM rolls back storage).
    function forceWriteFailure(bool armed) external {
        _forceWriteFailure = armed;
    }

    /// @notice Test-only entry counter, including non-zero starting values.
    function setEntryForTest(uint256 tokenId, uint256 entry) external {
        craftToEntry[tokenId] = entry;
    }

    function payloadAt(uint256 craftId, uint256 entry) external view returns (bytes memory) {
        return _payloads[craftId][entry];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        if (!craftToClaimed[tokenId]) revert MockVesselNonexistent(tokenId);
        return _owners[tokenId];
    }

    function vaultToEntry(uint256 _tokenId, uint256 _entry) external view returns (bytes memory) {
        return _payloads[_tokenId][_entry];
    }

    function setDelegate(uint256 _tokenId, address _delegate) external {
        if (!craftToClaimed[_tokenId]) revert MockVesselNonexistent(_tokenId);
        if (msg.sender != _owners[_tokenId]) revert MockVesselNotOwner();
        craftToDelegate[_tokenId] = _delegate;
    }

    function setPayloadHolder(uint256 _tokenId, bytes calldata _bytes) external {
        if (_forceWriteFailure) revert MockVesselWriteForcedFailure();
        if (!craftToClaimed[_tokenId]) revert MockVesselNonexistent(_tokenId);

        address owner = _owners[_tokenId];
        if (msg.sender != owner && msg.sender != craftToDelegate[_tokenId]) {
            revert MockVesselUnauthorized();
        }
        if (craftToLocked[_tokenId]) revert MockVesselLocked();
        if (_bytes.length > _tokenId) {
            revert MockVesselPayloadTooLarge(_bytes.length, _tokenId);
        }

        if (craftToVaultStatus[_tokenId]) {
            uint256 nextEntry = craftToEntry[_tokenId] + 1;
            _payloads[_tokenId][nextEntry] = _bytes;
            craftToEntry[_tokenId] = nextEntry;
        } else {
            _payloads[_tokenId][0] = _bytes;
        }
    }
}
