// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GiglyCredential
 * @notice Soulbound Token (SBT) representing Proof of Work for completed gigs on Gigly.
 * @dev Inherits ERC721 but overrides _update to prevent transfers (Soulbound).
 */
contract GiglyCredential is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    address public optimisticEscrow;

    // Mapping from owner to list of owned token IDs
    mapping(address => uint256[]) private _ownedTokens;

    // ─── Events ──────────────────────────────────────────────────────────

    event EscrowAddressUpdated(address oldEscrow, address newEscrow);
    event CredentialMinted(address indexed to, uint256 indexed tokenId, string uri);

    // ─── Errors ──────────────────────────────────────────────────────────

    error OnlyEscrowAllowed();
    error NonTransferableSBT();
    error InvalidAddress();

    // ─── Modifiers ───────────────────────────────────────────────────────

    modifier onlyEscrow() {
        if (msg.sender != optimisticEscrow) revert OnlyEscrowAllowed();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────

    constructor() ERC721("GiglyCredential", "GIG") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    // ─── Admin Functions ─────────────────────────────────────────────────

    /**
     * @notice Sets the authorised Escrow contract address that can mint credentials.
     * @param _escrow Address of the OptimisticEscrow contract.
     */
    function setOptimisticEscrow(address _escrow) external onlyOwner {
        if (_escrow == address(0)) revert InvalidAddress();
        address oldEscrow = optimisticEscrow;
        optimisticEscrow = _escrow;
        emit EscrowAddressUpdated(oldEscrow, _escrow);
    }

    // ─── Core Minting ────────────────────────────────────────────────────

    /**
     * @notice Mints a new SBT to the freelancer. Only callable by the Escrow contract.
     * @param to The address of the freelancer receiving the credential.
     * @param uri The IPFS URI containing the JSON metadata of the gig.
     * @return tokenId The ID of the newly minted token.
     */
    function mint(address to, string memory uri) external onlyEscrow returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        _ownedTokens[to].push(tokenId);
        
        emit CredentialMinted(to, tokenId, uri);
        return tokenId;
    }

    // ─── Helper Functions ────────────────────────────────────────────────

    /**
     * @notice Returns all token IDs owned by a specific freelancer.
     * @param freelancer The address to query.
     * @return An array of token IDs.
     */
    function getTokensByFreelancer(address freelancer) external view returns (uint256[] memory) {
        return _ownedTokens[freelancer];
    }

    // ─── Overrides ───────────────────────────────────────────────────────

    /**
     * @dev Overrides _update to enforce the Soulbound non-transferable property.
     * Tokens can only be minted (from address(0)) or burned (to address(0)).
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert NonTransferableSBT();
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Required override by Solidity for ERC721 and ERC721URIStorage.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Required override by Solidity for ERC721 and ERC721URIStorage.
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
