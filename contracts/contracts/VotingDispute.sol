// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface IOptimisticEscrow {
    enum Status {
        None,
        Funded,
        Submitted,
        Disputed,
        Released,
        Refunded
    }

    function jobs(uint256 jobId) external view returns (
        address client,
        address freelancer,
        uint256 amount,
        uint256 releasedAmount,
        uint256 submittedAt,
        Status status,
        string memory taskTitle,
        string memory submissionLink
    );

    function raiseDisputeAsArbiter(uint256 jobId, string calldata reason) external;
    function resolveDispute(uint256 jobId, uint256 amountToFreelancer) external;
}

interface IGiglyCredential {
    function getTokensByFreelancer(address user) external view returns (uint256[] memory);
    function mint(address to, string memory uri) external returns (uint256);
}

/**
 * @title VotingDispute
 * @author Gigly Team
 * @notice Decentralised community jury dispute resolution.
 *         Any GiglyCredential holder (>=1 NFT) can register as a juror.
 *         When a client raises a voting dispute, 3 jurors are randomly
 *         selected. Each juror independently reviews the submission and
 *         casts a vote. After the voting window closes (or all votes are
 *         in), anyone may finalise the dispute, which auto-splits escrow
 *         and mints a "+Contributor" SBT to every juror who voted.
 *
 *         Payout rules (3 jurors):
 *           >= 2 votes for freelancer (>= 60%) => full release to freelancer
 *           exactly 1 vote for freelancer      => 70% freelancer / 30% client
 *           0 votes for freelancer             => full refund to client
 *
 * @dev VotingDispute must be set as arbiter on OptimisticEscrow to call
 *      raiseDispute() and resolveDispute().
 *      GiglyCredential must also authorise VotingDispute as a minter.
 */
contract VotingDispute is ReentrancyGuard, Ownable {

    // ─── Constants ───────────────────────────────────────────────────────

    /// @notice Number of jurors selected per dispute.
    uint8  public constant JUROR_COUNT = 3;

    /// @notice Voting window duration — matches escrow test window (3 min).
    uint256 public constant VOTING_WINDOW = 3 minutes;

    /// @notice IPFS URI for the "+Contributor" SBT minted to voters.
    string  public constant CONTRIBUTOR_URI =
        "ipfs://bafkreicontributorvotingjurormetadatagiglyplatformcommunity";

    // ─── State ───────────────────────────────────────────────────────────

    IOptimisticEscrow public escrow;
    /// @notice Primary credential — used for minting +Contributor SBTs.
    IGiglyCredential  public credential;
    /// @notice Legacy credential — used ONLY for juror eligibility check.
    ///         Existing holders on the old contract can still register.
    IGiglyCredential  public legacyCredential;

    /// @notice Ordered pool of addresses that opted in as jurors.
    address[] public jurorPool;

    /// @notice Whether an address is currently registered as a juror.
    mapping(address => bool) public isJuror;

    /// @notice Auto-incrementing dispute counter (first dispute = 1).
    uint256 public disputeCount;

    // ─── Enums ───────────────────────────────────────────────────────────

    enum DisputeStatus {
        None,       // 0 - not created
        Voting,     // 1 - jurors assigned, votes open
        Finalised   // 2 - payout executed (terminal)
    }

    // ─── Structs ─────────────────────────────────────────────────────────

    struct Dispute {
        uint256 jobId;
        address client;
        string  reason;
        uint256 createdAt;
        DisputeStatus status;
        address[3] jurors;
        bool[3]    voted;
        bool[3]    voteForFreelancer;
        uint8      votesForFreelancer;
        uint8      totalVotesCast;
        bool       contributorMinted;
    }

    // ─── Storage ─────────────────────────────────────────────────────────

    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256) public jobToDispute;
    mapping(address => bool)    public hasDiscount;

    // ─── Events ──────────────────────────────────────────────────────────

    event JurorRegistered(address indexed juror);
    event JurorDeregistered(address indexed juror);

    event VotingDisputeRaised(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        address indexed client,
        address[3] jurors,
        string reason
    );

    event VoteCast(
        uint256 indexed disputeId,
        address indexed juror,
        bool voteForFreelancer
    );

    event DisputeFinalised(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        uint8 votesForFreelancer,
        uint256 amountToFreelancer,
        uint256 amountToClient
    );

    // ─── Errors ──────────────────────────────────────────────────────────

    error NotNFTHolder();
    error AlreadyRegistered();
    error NotRegistered();
    error NotEnoughJurors();
    error NotClient();
    error JobNotSubmitted();
    error DisputeAlreadyExists();
    error NotAssignedJuror();
    error AlreadyVoted();
    error VotingClosed();
    error VotingStillOpen();
    error DisputeNotVoting();
    error InvalidAddress();

    // ─── Constructor ─────────────────────────────────────────────────────

    constructor(address _escrow, address _credential) Ownable(msg.sender) {
        if (_escrow     == address(0)) revert InvalidAddress();
        if (_credential == address(0)) revert InvalidAddress();
        escrow     = IOptimisticEscrow(_escrow);
        credential = IGiglyCredential(_credential);
    }

    // ─── Admin ───────────────────────────────────────────────────────────

    function setEscrow(address _escrow) external onlyOwner {
        if (_escrow == address(0)) revert InvalidAddress();
        escrow = IOptimisticEscrow(_escrow);
    }

    function setCredential(address _credential) external onlyOwner {
        if (_credential == address(0)) revert InvalidAddress();
        credential = IGiglyCredential(_credential);
    }

    /// @notice Set the legacy credential contract for juror eligibility checks only.
    function setLegacyCredential(address _legacy) external onlyOwner {
        legacyCredential = IGiglyCredential(_legacy);
    }

    /// @notice Owner can directly register a juror (bypasses NFT check).
    ///         Use to onboard existing NFT holders before they self-register.
    function adminRegisterJuror(address juror) external onlyOwner {
        if (juror == address(0)) revert InvalidAddress();
        if (isJuror[juror]) revert AlreadyRegistered();
        isJuror[juror] = true;
        jurorPool.push(juror);
        emit JurorRegistered(juror);
    }

    // ─── Juror Registry ──────────────────────────────────────────────────

    /**
     * @notice Any GiglyCredential NFT holder (>=1 token on new OR legacy contract)
     *         may register as a potential juror.
     */
    function registerAsJuror() external {
        // Check new credential first, then fall back to legacy
        bool hasNFT = credential.getTokensByFreelancer(msg.sender).length > 0;
        if (!hasNFT && address(legacyCredential) != address(0)) {
            hasNFT = legacyCredential.getTokensByFreelancer(msg.sender).length > 0;
        }
        if (!hasNFT) revert NotNFTHolder();
        if (isJuror[msg.sender]) revert AlreadyRegistered();

        isJuror[msg.sender] = true;
        jurorPool.push(msg.sender);
        emit JurorRegistered(msg.sender);
    }

    /**
     * @notice Deregister from the juror pool.
     */
    function deregisterAsJuror() external {
        if (!isJuror[msg.sender]) revert NotRegistered();
        isJuror[msg.sender] = false;

        uint256 len = jurorPool.length;
        for (uint256 i = 0; i < len; i++) {
            if (jurorPool[i] == msg.sender) {
                jurorPool[i] = jurorPool[len - 1];
                jurorPool.pop();
                break;
            }
        }
        emit JurorDeregistered(msg.sender);
    }

    /// @notice Returns the current juror pool.
    function getJurorPool() external view returns (address[] memory) {
        return jurorPool;
    }

    /// @notice Returns total registered jurors.
    function jurorPoolSize() external view returns (uint256) {
        return jurorPool.length;
    }

    // ─── Raise Voting Dispute ────────────────────────────────────────────

    /**
     * @notice Client raises a community-voting dispute on a submitted job.
     * @dev Selects 3 jurors pseudo-randomly, then calls
     *      OptimisticEscrow.raiseDispute() to freeze the job.
     *      Requires >=3 registered jurors in the pool.
     * @param jobId  The escrow job ID.
     * @param reason Human-readable dispute reason visible to jurors.
     */
    function raiseVotingDispute(uint256 jobId, string calldata reason)
        external
        nonReentrant
    {
        (
            address client,
            address freelancer,
            ,
            ,
            ,
            IOptimisticEscrow.Status status,
            ,
        ) = escrow.jobs(jobId);

        if (msg.sender != client) revert NotClient();
        if (status != IOptimisticEscrow.Status.Submitted) revert JobNotSubmitted();
        if (jobToDispute[jobId] != 0) revert DisputeAlreadyExists();

        uint256 poolSize = jurorPool.length;
        if (poolSize < JUROR_COUNT) revert NotEnoughJurors();

        address[3] memory selected = _pickJurors(jobId, client, freelancer, poolSize);

        // Freeze job in escrow (arbiter-callable, sets status → Disputed)
        escrow.raiseDisputeAsArbiter(jobId, reason);

        disputeCount++;
        uint256 dId = disputeCount;

        Dispute storage d = disputes[dId];
        d.jobId     = jobId;
        d.client    = client;
        d.reason    = reason;
        d.createdAt = block.timestamp;
        d.status    = DisputeStatus.Voting;
        d.jurors    = selected;

        jobToDispute[jobId] = dId;

        emit VotingDisputeRaised(dId, jobId, client, selected, reason);
    }

    // ─── Cast Vote ───────────────────────────────────────────────────────

    /**
     * @notice An assigned juror casts their vote.
     * @param disputeId          The dispute to vote on.
     * @param voteForFreelancer  True = project is good; False = project failed.
     */
    function castVote(uint256 disputeId, bool voteForFreelancer)
        external
        nonReentrant
    {
        Dispute storage d = disputes[disputeId];
        if (d.status != DisputeStatus.Voting) revert DisputeNotVoting();
        if (block.timestamp >= d.createdAt + VOTING_WINDOW) revert VotingClosed();

        uint8 slot = _jurorSlot(d, msg.sender);
        if (slot == type(uint8).max) revert NotAssignedJuror();
        if (d.voted[slot]) revert AlreadyVoted();

        d.voted[slot]              = true;
        d.voteForFreelancer[slot]  = voteForFreelancer;
        d.totalVotesCast++;
        if (voteForFreelancer) d.votesForFreelancer++;

        emit VoteCast(disputeId, msg.sender, voteForFreelancer);
    }

    // ─── Finalise ────────────────────────────────────────────────────────

    /**
     * @notice Finalises the dispute and executes the on-chain payout.
     *         Can be called by anyone after the voting window has expired
     *         OR when all 3 jurors have voted.
     *
     *         Payout rules:
     *           votesForFreelancer >= 2 => 100% to freelancer
     *           votesForFreelancer == 1 => 70% freelancer / 30% client
     *           votesForFreelancer == 0 => 100% refund to client + discount flag
     *
     *         Every juror who voted receives a "+Contributor" SBT.
     */
    function finaliseDispute(uint256 disputeId) external nonReentrant {
        Dispute storage d = disputes[disputeId];
        if (d.status != DisputeStatus.Voting) revert DisputeNotVoting();

        bool windowExpired = block.timestamp >= d.createdAt + VOTING_WINDOW;
        bool allVoted      = d.totalVotesCast == JUROR_COUNT;
        if (!windowExpired && !allVoted) revert VotingStillOpen();

        d.status = DisputeStatus.Finalised;

        (   ,
            ,
            uint256 amount,
            ,
            ,
            ,
            ,

        ) = escrow.jobs(d.jobId);

        uint256 amountToFreelancer;
        if (d.votesForFreelancer >= 2) {
            amountToFreelancer = amount;
        } else if (d.votesForFreelancer == 1) {
            amountToFreelancer = (amount * 70) / 100;
        } else {
            amountToFreelancer = 0;
            if (!hasDiscount[d.client]) {
                hasDiscount[d.client] = true;
            }
        }

        escrow.resolveDispute(d.jobId, amountToFreelancer);

        uint256 amountToClient = amount - amountToFreelancer;

        emit DisputeFinalised(
            disputeId,
            d.jobId,
            d.votesForFreelancer,
            amountToFreelancer,
            amountToClient
        );

        // Mint "+Contributor" SBT to all jurors who voted
        if (!d.contributorMinted) {
            d.contributorMinted = true;
            for (uint8 i = 0; i < JUROR_COUNT; i++) {
                if (d.voted[i]) {
                    try credential.mint(d.jurors[i], CONTRIBUTOR_URI) {} catch {}
                }
            }
        }
    }

    // ─── Views ───────────────────────────────────────────────────────────

    /// @notice Full dispute info for a given dispute ID.
    function getDispute(uint256 disputeId) external view returns (
        uint256 jobId,
        address client,
        string memory reason,
        uint256 createdAt,
        DisputeStatus status,
        address[3] memory jurors,
        bool[3] memory voted,
        bool[3] memory voteForFreelancer,
        uint8 votesForFreelancer,
        uint8 totalVotesCast
    ) {
        Dispute storage d = disputes[disputeId];
        return (
            d.jobId,
            d.client,
            d.reason,
            d.createdAt,
            d.status,
            d.jurors,
            d.voted,
            d.voteForFreelancer,
            d.votesForFreelancer,
            d.totalVotesCast
        );
    }

    /// @notice Returns which slot index a juror occupies (255 = not assigned).
    function jurorSlotOf(uint256 disputeId, address juror) external view returns (uint8) {
        return _jurorSlot(disputes[disputeId], juror);
    }

    // ─── Internal Helpers ────────────────────────────────────────────────

    function _pickJurors(
        uint256 jobId,
        address client,
        address freelancer,
        uint256 poolSize
    ) internal view returns (address[3] memory selected) {
        uint256 seed      = uint256(keccak256(abi.encodePacked(block.prevrandao, jobId, block.timestamp)));
        uint8   picked    = 0;
        uint256 attempts  = 0;
        uint256 maxAttempts = poolSize * 4;

        // Pass 1: Try to pick jurors who are neither client nor freelancer
        while (picked < JUROR_COUNT && attempts < maxAttempts) {
            uint256 idx = (seed >> (attempts * 8)) % poolSize;
            address candidate = jurorPool[idx];

            if (
                candidate != client &&
                candidate != freelancer &&
                !_isDuplicate(selected, picked, candidate)
            ) {
                selected[picked] = candidate;
                picked++;
            }
            attempts++;

            if (attempts % 32 == 0) {
                seed = uint256(keccak256(abi.encodePacked(seed, attempts)));
            }
        }

        // Pass 2: Fallback for small pools (e.g. hackathon demo) - fill remaining slots with any unique juror
        if (picked < JUROR_COUNT) {
            for (uint256 i = 0; i < poolSize && picked < JUROR_COUNT; i++) {
                address candidate = jurorPool[i];
                if (!_isDuplicate(selected, picked, candidate)) {
                    selected[picked] = candidate;
                    picked++;
                }
            }
        }

        if (picked < JUROR_COUNT) revert NotEnoughJurors();
    }

    function _isDuplicate(address[3] memory arr, uint8 len, address candidate)
        internal pure returns (bool)
    {
        for (uint8 i = 0; i < len; i++) {
            if (arr[i] == candidate) return true;
        }
        return false;
    }

    function _jurorSlot(Dispute storage d, address juror) internal view returns (uint8) {
        for (uint8 i = 0; i < JUROR_COUNT; i++) {
            if (d.jurors[i] == juror) return i;
        }
        return type(uint8).max;
    }
}
