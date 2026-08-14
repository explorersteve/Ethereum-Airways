// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @dev Same ABI layout as the frozen `abi.encode` tuple in `BoardingPass._buildManifest`.
struct ManifestV1 {
    bytes4 magic;
    uint8 version;
    address issuer;
    uint256 expectedEntry;
    uint16 seatId;
    address traveler;
    string fullName;
    uint32 dateOfBirth;
    string twitterHandle;
    uint16 bagCount;
    uint256 totalPaid;
    uint256 timestamp;
    string origin;
    string destination;
    string trip;
    string departure;
    string flight;
}

contract ManifestDecoder {
    function decode(bytes calldata payload) external pure returns (ManifestV1 memory m) {
        (
            m.magic,
            m.version,
            m.issuer,
            m.expectedEntry,
            m.seatId,
            m.traveler,
            m.fullName,
            m.dateOfBirth,
            m.twitterHandle,
            m.bagCount,
            m.totalPaid,
            m.timestamp,
            m.origin,
            m.destination,
            m.trip,
            m.departure,
            m.flight
        ) =
            abi.decode(
                payload,
                (
                    bytes4,
                    uint8,
                    address,
                    uint256,
                    uint16,
                    address,
                    string,
                    uint32,
                    string,
                    uint16,
                    uint256,
                    uint256,
                    string,
                    string,
                    string,
                    string,
                    string
                )
            );
    }
}
