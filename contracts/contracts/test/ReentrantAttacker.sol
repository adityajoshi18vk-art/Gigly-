// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../OptimisticEscrow.sol";

/**
 * @title ReentrantAttacker
 * @notice A malicious contract that acts as a "freelancer" and attempts to
 *         re-enter OptimisticEscrow.claimAfterWindow when it receives tokens
 *         via the onTokenReceived hook.
 * @dev Deploy this as the freelancer address. When the escrow transfers
 *      tokens to it, the hook fires and tries to claim again.
 */
contract ReentrantAttacker {
    OptimisticEscrow public escrow;
    uint256 public targetJobId;
    uint256 public attackCount;

    constructor(address _escrow) {
        escrow = OptimisticEscrow(_escrow);
    }

    /// @notice Set which job to re-enter on.
    function setTarget(uint256 _jobId) external {
        targetJobId = _jobId;
    }

    /**
     * @notice Called by the ReentrantToken during transfer.
     *         Attempts to re-enter claimAfterWindow on the escrow.
     */
    function onTokenReceived(address, uint256) external {
        if (attackCount == 0) {
            attackCount++;
            // Attempt reentrancy — this should revert due to ReentrancyGuard
            escrow.claimAfterWindow(targetJobId);
        }
    }
}
