// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @dev Canonical boarding-pass record. Packed widths are used only where the
///      maximum is proven: DOB is `yyyymmdd` ≤ 99991231; `seatId`/`bagCount` are
///      `uint16` at the ABI. `mintedAt`, `totalPaid`, craft id, and entry stay
///      `uint256` so `vesselPayloadFor` can replay `abi.encode` without narrowing
///      `block.timestamp`, `msg.value`, or `craftToEntry`.
struct BoardingPassData {
    address traveler;
    uint32 dateOfBirth;
    uint16 seatId;
    uint16 bagCount;
    uint256 mintedAt;
    uint256 totalPaid;
    uint256 vesselCraftId;
    uint256 vesselEntry;
    string fullName;
    string twitterHandle;
}

/// @title Reads the renderer (and other callers) need from BoardingPass.
interface IBoardingPass {
    function getBoardingPass(uint256 tokenId) external view returns (BoardingPassData memory);
    function vesselPayloadFor(uint256 tokenId) external view returns (bytes memory);
    function seatExists(uint16 seatId) external view returns (bool);
    function seatLabel(uint16 seatId) external view returns (string memory);
    function seatPrice(uint16 seatId) external view returns (uint256);
}
