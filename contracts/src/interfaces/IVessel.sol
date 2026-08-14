// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Minimal Vessel surface used by BoardingPass.
/// @dev Subset of official `IVESSEL` from
///      https://github.com/producedbydav/The-Vessel/blob/main/Core%20Contracts/IVESSEL.sol
///      (`pragma ^0.8.20`). Function signatures match that file; nothing here may be invented.
interface IVessel {
    function craftToVaultStatus(uint256 _tokenId) external view returns (bool);
    function craftToLocked(uint256 _tokenId) external view returns (bool);
    function craftToDelegate(uint256) external view returns (address);
    function craftToEntry(uint256) external view returns (uint256);
    function craftToClaimed(uint256) external view returns (bool);
    function ownerOf(uint256 tokenId) external view returns (address);
    function setPayloadHolder(uint256 _tokenId, bytes calldata _bytes) external;
    function setDelegate(uint256 _tokenId, address _delegate) external;
    function vaultToEntry(uint256 _tokenId, uint256 _entry) external view returns (bytes memory);
}
