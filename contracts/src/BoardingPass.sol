// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {BoardingPassData, IBoardingPass} from "./interfaces/IBoardingPass.sol";
import {IBoardingPassRenderer} from "./interfaces/IBoardingPassRenderer.sol";
import {IVessel} from "./interfaces/IVessel.sol";
import {DateLib} from "./libraries/DateLib.sol";
import {SeatLib} from "./libraries/SeatLib.sol";

/// @title Ethereum Airways boarding-pass ERC-721.
/// @notice One payable entry point charges the exact fare, appends a Vessel Vault
///         manifest entry, and mints `tokenId == seatId`.
contract BoardingPass is ERC721, Ownable2Step, Pausable, ReentrancyGuard, IBoardingPass {
    uint256 public constant BASE_FARE = 0.001 ether;
    uint256 public constant BAG_PRICE = 0.01 ether;

    bytes4 public constant MANIFEST_MAGIC = 0x45544841;
    uint8 public constant MANIFEST_VERSION = 1;
    uint256 public constant MAX_NAME_BYTES = 48;
    uint256 public constant MAX_HANDLE_BYTES = 32;

    string public constant ORIGIN = "Current Location";
    string public constant DESTINATION = "Ethereum";
    string public constant TRIP = "Round Trip";
    string public constant DEPARTURE = "Now";
    string public constant FLIGHT = "ETH001";

    IVessel public immutable VESSEL;

    uint16 public vesselCraftId;
    address public renderer;
    bool public rendererFrozen;
    address public treasury;

    mapping(uint256 => BoardingPassData) private _passes;

    event BoardingPassMinted(
        address indexed traveler,
        uint256 indexed tokenId,
        uint16 indexed seatId,
        uint256 totalPaid,
        uint16 bagCount,
        uint256 vesselCraftId,
        uint256 vesselEntry
    );
    event RendererUpdated(address indexed renderer);
    event RendererFrozen();
    event VesselCraftUpdated(uint256 indexed oldCraftId, uint256 indexed newCraftId);
    event TreasuryUpdated(address indexed treasury);

    error InvalidSeat(uint16 seatId);
    error SeatAlreadyClaimed(uint16 seatId);
    error InvalidName();
    error InvalidDateOfBirth(uint32 dateOfBirth);
    error InvalidTwitterHandle();
    error IncorrectPayment(uint256 expected, uint256 received);
    error VesselCraftNotVault(uint256 craftId);
    error VesselCraftLocked(uint256 craftId);
    error VesselDelegateMismatch(address expected, address actual);
    error VesselPayloadTooLarge(uint256 length, uint256 capacity);
    error VesselEntryMismatch();
    /// @dev Named `RendererIsFrozen` (plan 06) so it does not collide with `event RendererFrozen`.
    error RendererIsFrozen();
    error RendererUnset();
    error NothingToWithdraw();
    error TransferFailed();

    constructor(address vessel_, uint16 vesselCraftId_, address treasury_, address initialOwner)
        ERC721("Ethereum Boarding Pass", "ETHAIR")
        Ownable(initialOwner)
    {
        VESSEL = IVessel(vessel_);
        _setTreasury(treasury_);
        vesselCraftId = vesselCraftId_;
        // Delegate is set after this contract is deployed; constructor only checks Vault + lock.
        _requireVesselReady(uint256(vesselCraftId_), false);
    }

    function seatExists(uint16 seatId) public pure override returns (bool) {
        return SeatLib.exists(seatId);
    }

    function seatLabel(uint16 seatId) public pure override returns (string memory) {
        if (!SeatLib.exists(seatId)) revert InvalidSeat(seatId);
        return SeatLib.label(seatId);
    }

    function seatPrice(uint16 seatId) public pure override returns (uint256) {
        if (!SeatLib.exists(seatId)) revert InvalidSeat(seatId);
        return SeatLib.price(seatId);
    }

    /// @dev `bagCount` is `uint16`, so `BAG_PRICE * bagCount` cannot overflow `uint256`.
    function quote(uint16 seatId, uint16 bagCount) public pure returns (uint256) {
        return BASE_FARE + seatPrice(seatId) + BAG_PRICE * uint256(bagCount);
    }

    function isSeatAvailable(uint16 seatId) public view returns (bool) {
        return SeatLib.exists(seatId) && _ownerOf(uint256(seatId)) == address(0);
    }

    function getSeatAvailability(uint16[] calldata seatIds) external view returns (bool[] memory) {
        uint256 n = seatIds.length;
        bool[] memory out = new bool[](n);
        for (uint256 i = 0; i < n; i++) {
            out[i] = isSeatAvailable(seatIds[i]);
        }
        return out;
    }

    function getBoardingPass(uint256 tokenId) public view override returns (BoardingPassData memory) {
        _requireOwned(tokenId);
        return _passes[tokenId];
    }

    function vesselPayloadFor(uint256 tokenId) public view override returns (bytes memory) {
        return _buildManifest(getBoardingPass(tokenId));
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        address renderer_ = renderer;
        if (renderer_ == address(0)) revert RendererUnset();
        return IBoardingPassRenderer(renderer_).tokenURI(tokenId);
    }

    /// @dev `nonReentrant` guards this entry point. `VESSEL` is immutable trusted
    ///      infrastructure; the typed `setPayloadHolder` call is never wrapped in
    ///      try/catch or a low-level call so a Vessel revert rolls back the booking.
    ///      `_safeMint` is last so an ERC-721 receiver callback observes fully
    ///      written pass data and cannot re-enter booking.
    function bookAndMint(
        uint16 seatId,
        string calldata fullName,
        uint32 dateOfBirth,
        string calldata twitterHandle,
        uint16 bagCount
    ) external payable nonReentrant whenNotPaused {
        if (!SeatLib.exists(seatId)) revert InvalidSeat(seatId);
        if (_ownerOf(uint256(seatId)) != address(0)) revert SeatAlreadyClaimed(seatId);
        _requireValidName(fullName);
        if (!DateLib.isValid(dateOfBirth)) revert InvalidDateOfBirth(dateOfBirth);
        _requireValidHandle(twitterHandle);

        uint256 expected = quote(seatId, bagCount);
        if (msg.value != expected) revert IncorrectPayment(expected, msg.value);

        _commitMint(seatId, fullName, dateOfBirth, twitterHandle, bagCount);
    }

    function _commitMint(
        uint16 seatId,
        string calldata fullName,
        uint32 dateOfBirth,
        string calldata twitterHandle,
        uint16 bagCount
    ) private {
        uint256 craftId = uint256(vesselCraftId);
        _requireVesselReady(craftId, true);

        BoardingPassData memory data = BoardingPassData({
            traveler: msg.sender,
            dateOfBirth: dateOfBirth,
            seatId: seatId,
            bagCount: bagCount,
            mintedAt: block.timestamp,
            totalPaid: msg.value,
            vesselCraftId: craftId,
            vesselEntry: VESSEL.craftToEntry(craftId) + 1,
            fullName: fullName,
            twitterHandle: twitterHandle
        });

        bytes memory payload = _buildManifest(data);
        if (payload.length > craftId) revert VesselPayloadTooLarge(payload.length, craftId);

        VESSEL.setPayloadHolder(craftId, payload);

        if (VESSEL.craftToEntry(craftId) != data.vesselEntry) revert VesselEntryMismatch();

        _passes[uint256(seatId)] = data;
        _safeMint(msg.sender, uint256(seatId));
        emit BoardingPassMinted(
            msg.sender, uint256(seatId), seatId, data.totalPaid, bagCount, craftId, data.vesselEntry
        );
    }

    function setRenderer(address renderer_) external onlyOwner {
        if (rendererFrozen) revert RendererIsFrozen();
        renderer = renderer_;
        emit RendererUpdated(renderer_);
    }

    function freezeRenderer() external onlyOwner {
        rendererFrozen = true;
        emit RendererFrozen();
    }

    function setVesselCraftId(uint16 newCraftId) external onlyOwner whenPaused {
        _requireVesselReady(uint256(newCraftId), true);
        uint256 oldCraftId = uint256(vesselCraftId);
        vesselCraftId = newCraftId;
        emit VesselCraftUpdated(oldCraftId, uint256(newCraftId));
    }

    function setTreasury(address newTreasury) external onlyOwner {
        _setTreasury(newTreasury);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();
        address to = treasury;
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Tuple order is frozen. Documented in `contracts/README.md`.
    ///      Types: (bytes4, uint8, address, uint256, uint16, address, string, uint32,
    ///      string, uint16, uint256, uint256, string, string, string, string, string).
    function _buildManifest(BoardingPassData memory data) internal view returns (bytes memory) {
        return abi.encode(
            MANIFEST_MAGIC,
            MANIFEST_VERSION,
            address(this),
            data.vesselEntry,
            data.seatId,
            data.traveler,
            data.fullName,
            data.dateOfBirth,
            data.twitterHandle,
            data.bagCount,
            data.totalPaid,
            data.mintedAt,
            ORIGIN,
            DESTINATION,
            TRIP,
            DEPARTURE,
            FLIGHT
        );
    }

    function _requireVesselReady(uint256 craftId, bool requireDelegate) internal view {
        if (!VESSEL.craftToVaultStatus(craftId)) revert VesselCraftNotVault(craftId);
        if (VESSEL.craftToLocked(craftId)) revert VesselCraftLocked(craftId);
        if (requireDelegate) {
            address actual = VESSEL.craftToDelegate(craftId);
            if (actual != address(this)) revert VesselDelegateMismatch(address(this), actual);
        }
    }

    function _setTreasury(address newTreasury) private {
        // Address(0) would burn withdrawals; reuse TransferFailed rather than a extra error.
        if (newTreasury == address(0)) revert TransferFailed();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function _requireValidName(string calldata fullName) private pure {
        uint256 len = bytes(fullName).length;
        if (len == 0 || len > MAX_NAME_BYTES || _hasControlChar(fullName)) revert InvalidName();
    }

    function _requireValidHandle(string calldata twitterHandle) private pure {
        bytes memory raw = bytes(twitterHandle);
        if (raw.length > MAX_HANDLE_BYTES) revert InvalidTwitterHandle();
        if (raw.length > 0 && raw[0] == "@") revert InvalidTwitterHandle();
        if (_hasControlChar(twitterHandle)) revert InvalidTwitterHandle();
    }

    function _hasControlChar(string memory s) private pure returns (bool) {
        bytes memory raw = bytes(s);
        for (uint256 i = 0; i < raw.length; i++) {
            uint8 c = uint8(raw[i]);
            if (c < 0x20 || c == 0x7f) return true;
        }
        return false;
    }
}
