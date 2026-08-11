// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @author Gigly Team
 * @notice A mintable ERC-20 token that mimics USDC for testnet usage.
 * @dev Uses 6 decimals (same as real USDC). Owner can mint freely; anyone can
 *      call faucet() once per 24 hours to receive 1,000 USDC.
 *      Anyone can call buyWithEth() to exchange Sepolia ETH for MockUSDC
 *      at a fixed rate (no DEX required).
 */
contract MockUSDC is ERC20, Ownable {
    /// @notice Amount minted per faucet claim: 1,000 USDC (6 decimals).
    uint256 public constant FAUCET_AMOUNT = 1_000 * 10 ** 6;

    /// @notice Cooldown period between faucet claims per address: 24 hours.
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    /// @notice Exchange rate: 1 ETH = 2,000 USDC (testnet approximation).
    /// usdcOut = msg.value * ETH_TO_USDC_RATE / 1e12
    uint256 public constant ETH_TO_USDC_RATE = 2_000;

    /// @notice Tracks the last timestamp each address claimed from the faucet.
    mapping(address => uint256) public lastFaucetClaim;

    /// @notice Emitted when a user swaps ETH for MockUSDC.
    event BoughtWithEth(address indexed buyer, uint256 ethIn, uint256 usdcOut);

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

    /**
     * @notice Exchange Sepolia ETH for MockUSDC at a fixed 1 ETH = 2,000 USDC rate.
     * @dev No DEX or liquidity pool needed. ETH is held in contract; owner
     *      can collect it via withdrawEth(). Minimum swap: 0.001 ETH (= 2 USDC).
     *      Formula: usdcOut = msg.value * 2000 / 1e12
     */
    function buyWithEth() external payable {
        require(msg.value > 0, "MockUSDC: send ETH to buy USDC");
        uint256 usdcOut = (msg.value * ETH_TO_USDC_RATE) / 1e12;
        require(usdcOut > 0, "MockUSDC: amount too small, send at least 0.001 ETH");
        _mint(msg.sender, usdcOut);
        emit BoughtWithEth(msg.sender, msg.value, usdcOut);
    }

    /**
     * @notice Preview: how much USDC you get for a given ETH amount (in wei).
     */
    function quoteEthToUsdc(uint256 ethAmount) external pure returns (uint256) {
        return (ethAmount * ETH_TO_USDC_RATE) / 1e12;
    }

    /**
     * @notice Claims 1,000 USDC from the testnet faucet.
     * @dev Permissionless, but rate-limited to once per 24 hours per address.
     *      Reverts with a human-readable message if called too soon.
     */
    function faucet() external {
        uint256 lastClaim = lastFaucetClaim[msg.sender];
        require(
            block.timestamp >= lastClaim + FAUCET_COOLDOWN,
            "Faucet: please wait 24 hours between claims"
        );
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Returns the number of seconds until the caller can claim again.
     * @dev Returns 0 if the cooldown has already expired (i.e. they can claim now).
     * @return secondsUntilNextClaim Seconds remaining, or 0 if ready.
     */
    function timeUntilNextClaim(address claimer) external view returns (uint256) {
        uint256 nextAllowed = lastFaucetClaim[claimer] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
    }

    /**
     * @notice Withdraws all accumulated ETH from buyWithEth() to the owner wallet.
     */
    function withdrawEth() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "MockUSDC: nothing to withdraw");
        (bool ok, ) = payable(owner()).call{value: bal}("");
        require(ok, "MockUSDC: ETH transfer failed");
    }
}
