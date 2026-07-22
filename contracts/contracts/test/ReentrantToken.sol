// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../MockUSDC.sol";

/**
 * @title ReentrantToken
 * @notice A malicious ERC-20 that calls a hook on the recipient during transfer,
 *         simulating tokens with callbacks (e.g. ERC-777, ERC-1363).
 *         Used exclusively for reentrancy testing.
 */
contract ReentrantToken is MockUSDC {
    /**
     * @dev Overrides the internal _update to call onTokenReceived on the
     *      recipient if it is a contract. This simulates the callback
     *      vector that real hook-enabled tokens expose.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        super._update(from, to, value);

        // If `to` is a contract, call the hook (ignore failures from EOAs)
        if (to.code.length > 0) {
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, bytes memory returndata) = to.call(
                abi.encodeWithSignature("onTokenReceived(address,uint256)", from, value)
            );
            // Propagate the revert — this is how real hook-enabled tokens
            // (ERC-777, ERC-1363) behave: if the hook reverts, the
            // transfer reverts.
            if (!success && returndata.length > 0) {
                // Bubble up the revert reason
                assembly {
                    revert(add(returndata, 32), mload(returndata))
                }
            }
        }
    }
}
