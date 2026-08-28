// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockINRFeed
 * @notice Mimics a Chainlink AggregatorV3Interface for INR/USD.
 *         Owner can update the price; anyone can read it.
 *         Stores price with 8 decimals (like real Chainlink feeds).
 */
contract MockINRFeed {
    address public owner;
    int256 public answer;      // e.g. 8550000000 = 85.50 INR/USD
    uint8  public decimals;
    uint80 private _roundId;
    uint256 private _updatedAt;

    constructor(int256 _initialAnswer) {
        owner = msg.sender;
        answer = _initialAnswer;
        decimals = 8;
        _roundId = 1;
        _updatedAt = block.timestamp;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function updateAnswer(int256 _newAnswer) external onlyOwner {
        answer = _newAnswer;
        _roundId++;
        _updatedAt = block.timestamp;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer_,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, answer, _updatedAt, _updatedAt, _roundId);
    }

    function description() external pure returns (string memory) {
        return "INR / USD";
    }
}
