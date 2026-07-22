// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @author Gigly Team
 * @notice A mintable ERC-20 token that mimics USDC for testnet usage.
 * @dev Uses 6 decimals (same as real USDC) and restricts minting to the contract owner.
 */
contract MockUSDC is ERC20, Ownable {
    /**
     * @notice Deploys MockUSDC and sets the deployer as the owner.
     */
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {}

    /**
     * @notice Returns the number of decimals used by the token.
     * @dev Overrides the default 18 decimals to match the real USDC (6 decimals).
     * @return The number of decimals (6).
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Mints new USDC tokens to a specified address.
     * @dev Only callable by the contract owner. Used for testnet faucet / seeding.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint (in smallest unit, i.e. 1 USDC = 1_000_000).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
