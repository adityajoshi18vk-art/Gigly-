// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IGiglyCredential {
    function mint(address to, string memory uri) external returns (uint256);
}

/**
 * @title OptimisticEscrow
 * @author Gigly Team
 * @notice An optimistic escrow contract for freelance gig payments on Polygon.
 *         Clients lock USDC into jobs. Freelancers submit work, triggering a
 *         24-hour review window. If the client does not dispute in time, anyone
 *         can release the funds to the freelancer.
 * @dev Uses OpenZeppelin's ReentrancyGuard, Ownable, and SafeERC20.
 *      The contract owner acts as the platform admin (can set fees, arbiter).
 *      The arbiter resolves disputes by splitting funds.
 */
contract OptimisticEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── Constants ───────────────────────────────────────────────────────

    /// @notice Duration of the review window after work submission (24 hours default, matches UI).
    uint256 public reviewWindow = 24 hours;

    /// @notice Maximum platform fee in basis points (3% = 300 bps).
    uint256 public constant MAX_FEE_BPS = 300;

    /// @notice Default IPFS URI for auto-claims to prevent spoofing.
    string public constant DEFAULT_AUTOCLAIM_URI = "ipfs://bafkreihdwdcefgh4dqkjv67uzcmw7oqwj2c7vaxvx3qy3n3yvyg3y7qywe";

    // ─── State ───────────────────────────────────────────────────────────

    /// @notice The ERC-20 token used for payments (USDC).
    IERC20 public immutable paymentToken;

    /// @notice The address authorised to resolve disputes.
    address public arbiter;

    /// @notice Platform fee in basis points (e.g. 250 = 2.5%).
    uint256 public feeBps;

    /// @notice Accumulated platform fees available for withdrawal.
    uint256 public accumulatedFees;

    /// @notice Treasury wallet where platform fees are sent. If zero, fees stay in contract.
    address public treasuryWallet;

    /// @notice Auto-incrementing job counter (first job = 1).
    uint256 public jobCount;

    /// @notice The GiglyCredential contract for issuing SBTs.
    IGiglyCredential public giglyCredential;

    // ─── Enums ───────────────────────────────────────────────────────────

    /// @notice Lifecycle states of a job.
    enum Status {
        None,       // 0 — default / non-existent
        Funded,     // 1 — USDC locked by client
        Submitted,  // 2 — freelancer submitted work, timer started
        Disputed,   // 3 — client raised a dispute within the window
        Released,   // 4 — funds sent to freelancer (terminal)
        Refunded    // 5 — funds returned to client via dispute resolution (terminal)
    }

    // ─── Structs ─────────────────────────────────────────────────────────

    /// @notice On-chain representation of a gig job.
    struct Job {
        address client;
        address freelancer;
        uint256 amount;         // gross USDC locked (before fees)
        uint256 releasedAmount; // net USDC sent to freelancer after resolution
        uint256 submittedAt;    // timestamp when work was submitted (0 if not yet)
        Status  status;
        string  taskTitle;      // human-readable task description
        string  submissionLink; // link to submitted work (stored on-chain)
    }

    // ─── Storage ─────────────────────────────────────────────────────────

    /// @notice Mapping from job ID to Job struct.
    mapping(uint256 => Job) public jobs;

    // ─── Events ──────────────────────────────────────────────────────────

    /// @notice Emitted when a new job is created and funded.
    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed freelancer,
        uint256 amount,
        string  taskTitle
    );

    /// @notice Emitted when a freelancer accepts an open job.
    event JobAccepted(uint256 indexed jobId, address indexed freelancer);

    /// @notice Emitted when a freelancer submits work for review.
    event WorkSubmitted(uint256 indexed jobId, uint256 submittedAt, string submissionLink);

    /// @notice Emitted when a freelancer logs progress on a funded job.
    event ProgressLogged(uint256 indexed jobId, uint8 percent, string note);

    /// @notice Emitted when a client approves and releases funds early.
    event FundsReleased(uint256 indexed jobId, uint256 netAmount, uint256 fee);

    /// @notice Emitted when a client raises a dispute.
    event DisputeRaised(uint256 indexed jobId, address indexed raisedBy, string reason);

    /// @notice Emitted when the arbiter resolves a dispute.
    event DisputeResolved(
        uint256 indexed jobId,
        uint256 amountToFreelancer,
        uint256 amountToClient,
        uint256 fee
    );

    /// @notice Emitted when accumulated platform fees are withdrawn.
    event FeesWithdrawn(address indexed to, uint256 amount);

    // ─── Errors ──────────────────────────────────────────────────────────

    error InvalidAddress();
    error InvalidAmount();
    error FeeTooHigh();
    error OnlyClient();
    error OnlyFreelancer();
    error OnlyArbiter();
    error InvalidStatus(Status expected, Status actual);
    error ReviewWindowNotExpired();
    error ReviewWindowExpired();
    error SplitExceedsAmount();
    error JobAlreadyAssigned();
    error ClientCannotAcceptOwnJob();

    // ─── Modifiers ───────────────────────────────────────────────────────

    /// @dev Restricts access to the job's client.
    modifier onlyClient(uint256 jobId) {
        if (msg.sender != jobs[jobId].client) revert OnlyClient();
        _;
    }

    /// @dev Restricts access to the job's freelancer.
    modifier onlyFreelancer(uint256 jobId) {
        if (msg.sender != jobs[jobId].freelancer) revert OnlyFreelancer();
        _;
    }

    /// @dev Restricts access to the platform arbiter.
    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert OnlyArbiter();
        _;
    }

    /// @dev Ensures the job is in the expected status.
    modifier inStatus(uint256 jobId, Status expected) {
        if (jobs[jobId].status != expected)
            revert InvalidStatus(expected, jobs[jobId].status);
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────

    /**
     * @notice Deploys the escrow contract.
     * @param _paymentToken Address of the ERC-20 token used for payments (USDC).
     * @param _arbiter      Address authorised to resolve disputes.
     * @param _feeBps       Initial platform fee in basis points (max 300 = 3%).
     */
    constructor(
        address _paymentToken,
        address _arbiter,
        uint256 _feeBps
    ) Ownable(msg.sender) {
        if (_paymentToken == address(0)) revert InvalidAddress();
        if (_arbiter == address(0)) revert InvalidAddress();
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();

        paymentToken = IERC20(_paymentToken);
        arbiter = _arbiter;
        feeBps = _feeBps;
    }

    // ─── Core Job Lifecycle ──────────────────────────────────────────────

    /**
     * @notice Creates a new job and locks USDC from the client.
     * @dev The caller must have approved this contract to spend `amount` of USDC.
     * @param freelancer The address of the freelancer who will do the work.
     * @param amount     The gross USDC amount to lock (before platform fee).
     * @param taskTitle  A human-readable title/description of the task.
     * @return jobId     The unique identifier for the newly created job.
     */
    function createJob(
        address freelancer,
        uint256 amount,
        string calldata taskTitle
    ) external nonReentrant returns (uint256 jobId) {
        if (freelancer == msg.sender) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        jobCount++;
        jobId = jobCount;

        jobs[jobId] = Job({
            client: msg.sender,
            freelancer: freelancer,
            amount: amount,
            releasedAmount: 0,
            submittedAt: 0,
            status: Status.Funded,
            taskTitle: taskTitle,
            submissionLink: ""
        });

        // Pull USDC from client into this contract
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);

        emit JobCreated(jobId, msg.sender, freelancer, amount, taskTitle);
    }

    /**
     * @notice Allows a freelancer to claim an open job.
     * @dev Job must be Funded and not have an assigned freelancer. Client cannot accept their own job.
     * @param jobId The ID of the job to accept.
     */
    function acceptJob(uint256 jobId) external nonReentrant inStatus(jobId, Status.Funded) {
        Job storage job = jobs[jobId];
        if (job.client == msg.sender) revert ClientCannotAcceptOwnJob();
        if (job.freelancer != address(0)) revert JobAlreadyAssigned();

        job.freelancer = msg.sender;
        emit JobAccepted(jobId, msg.sender);
    }

    /**
     * @notice Freelancer logs progress on a Funded job. No state change, purely an event log.
     * @dev Can only be called by the job's freelancer when status is Funded.
     * @param jobId The ID of the job.
     * @param percent The completion percentage (0-100).
     * @param note An optional text note.
     */
    function logProgress(uint256 jobId, uint8 percent, string calldata note)
        external
        onlyFreelancer(jobId)
        inStatus(jobId, Status.Funded)
    {
        require(percent <= 100, "Percent cannot exceed 100");
        emit ProgressLogged(jobId, percent, note);
    }

    /**
     * @notice Freelancer marks work as submitted, starting the 24-hour review timer.
     * @dev Can only be called by the job's freelancer when status is Funded.
     * @param jobId The ID of the job to submit work for.
     * @param submissionLink A link to the submitted work.
     */
    function submitWork(uint256 jobId, string calldata submissionLink)
        external
        onlyFreelancer(jobId)
        inStatus(jobId, Status.Funded)
    {
        Job storage job = jobs[jobId];
        job.status = Status.Submitted;
        job.submittedAt = block.timestamp;
        job.submissionLink = submissionLink; // persist link in contract state

        emit WorkSubmitted(jobId, block.timestamp, submissionLink);
    }

    /**
     * @notice Client approves the work and releases funds to the freelancer early
     *         (before the 24-hour window expires).
     * @dev Deducts the platform fee and sends the net amount to the freelancer.
     * @param jobId The ID of the job to approve.
     * @param metadataURI The IPFS URI containing the credential metadata.
     */
    function approveAndRelease(uint256 jobId, string calldata metadataURI)
        external
        nonReentrant
        onlyClient(jobId)
        inStatus(jobId, Status.Submitted)
    {
        _releaseFunds(jobId, metadataURI);
    }

    /**
     * @notice Anyone can trigger the release of funds once the 24-hour review window
     *         has expired without a dispute.
     * @dev This implements the "optimistic" release — silence equals approval.
     * @param jobId The ID of the job to claim.
     */
    function claimAfterWindow(uint256 jobId)
        external
        nonReentrant
        inStatus(jobId, Status.Submitted)
    {
        Job storage job = jobs[jobId];
        if (block.timestamp < job.submittedAt + reviewWindow)
            revert ReviewWindowNotExpired();

        _releaseFunds(jobId, DEFAULT_AUTOCLAIM_URI);
    }

    /**
     * @notice Client raises a dispute within the 24-hour review window, freezing funds.
     * @dev The job must be in Submitted status and the window must not have expired.
     * @param jobId The ID of the job to dispute.
     * @param reason The reason for the dispute.
     */
    function raiseDispute(uint256 jobId, string calldata reason)
        external
        onlyClient(jobId)
        inStatus(jobId, Status.Submitted)
    {
        Job storage job = jobs[jobId];
        if (block.timestamp >= job.submittedAt + reviewWindow)
            revert ReviewWindowExpired();

        job.status = Status.Disputed;

        emit DisputeRaised(jobId, msg.sender, reason);
    }

    /**
     * @notice Arbiter (VotingDispute contract) freezes a job into Disputed state
     *         so community jury voting can proceed.
     */
    function raiseDisputeAsArbiter(uint256 jobId, string calldata reason)
        external
        onlyArbiter
        inStatus(jobId, Status.Submitted)
    {
        Job storage job = jobs[jobId];
        if (block.timestamp >= job.submittedAt + reviewWindow)
            revert ReviewWindowExpired();

        job.status = Status.Disputed;

        emit DisputeRaised(jobId, job.client, reason);
    }

    /**
     * @notice Arbiter resolves a dispute by specifying how much goes to the freelancer.
     *         The remainder (minus platform fee on the freelancer portion) goes back to the client.
     * @dev Only the arbiter can call this. The platform fee is only taken from the
     *      freelancer's portion, not the client refund.
     * @param jobId              The ID of the disputed job.
     * @param amountToFreelancer The gross amount allocated to the freelancer (fee deducted from this).
     */
    function resolveDispute(uint256 jobId, uint256 amountToFreelancer)
        external
        nonReentrant
        onlyArbiter
        inStatus(jobId, Status.Disputed)
    {
        Job storage job = jobs[jobId];
        if (amountToFreelancer > job.amount) revert SplitExceedsAmount();

        uint256 amountToClient = job.amount - amountToFreelancer;

        // Calculate fee only on the freelancer's portion
        uint256 fee = (amountToFreelancer * feeBps) / 10_000;
        uint256 netToFreelancer = amountToFreelancer - fee;

        job.releasedAmount = netToFreelancer;
        job.status = amountToFreelancer > 0 ? Status.Released : Status.Refunded;
        accumulatedFees += fee;

        // Transfer funds
        if (netToFreelancer > 0) {
            paymentToken.safeTransfer(job.freelancer, netToFreelancer);
        }
        if (amountToClient > 0) {
            paymentToken.safeTransfer(job.client, amountToClient);
        }

        emit DisputeResolved(jobId, netToFreelancer, amountToClient, fee);
    }

    // ─── Admin Functions ─────────────────────────────────────────────────

    /**
     * @notice Updates the platform fee. Only callable by the contract owner.
     * @param newFeeBps The new fee in basis points (max 300 = 3%).
     */
    function setFeeBps(uint256 newFeeBps) public onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = newFeeBps;
    }

    /**
     * @notice Updates the platform fee. Alias for setFeeBps. Only callable by the contract owner.
     * @param _percentage The new fee in basis points (max 300 = 3%).
     */
    function setPlatformFee(uint256 _percentage) external onlyOwner {
        setFeeBps(_percentage);
    }

    /**
     * @notice Updates the arbiter address. Only callable by the contract owner.
     * @param newArbiter The new arbiter address.
     */
    function setArbiter(address newArbiter) external onlyOwner {
        if (newArbiter == address(0)) revert InvalidAddress();
        arbiter = newArbiter;
    }

    /**
     * @notice Updates the GiglyCredential SBT contract address.
     * @param _giglyCredential The new contract address.
     */
    function setGiglyCredential(address _giglyCredential) external onlyOwner {
        if (_giglyCredential == address(0)) revert InvalidAddress();
        giglyCredential = IGiglyCredential(_giglyCredential);
    }

    /**
     * @notice Updates the review window duration. Only callable by the contract owner.
     * @param newReviewWindow The new duration in seconds (e.g. 1 hours or 24 hours).
     */
    function setReviewWindow(uint256 newReviewWindow) external onlyOwner {
        reviewWindow = newReviewWindow;
    }

    /**
     * @notice Updates the treasury wallet address. Only callable by the contract owner.
     * @param _treasury The new treasury wallet address (set to address(0) to keep fees in contract).
     */
    function setTreasuryWallet(address _treasury) external onlyOwner {
        treasuryWallet = _treasury;
    }

    /**
     * @notice Simplified dispute resolution: full refund to client or full release to freelancer.
     * @dev Only callable by the contract owner. If freelancer wins, SBT is minted.
     * @param jobId        The ID of the disputed job.
     * @param refundClient If true, full refund to client. If false, full release to freelancer + SBT mint.
     */
    function resolveDispute(uint256 jobId, bool refundClient)
        public
        nonReentrant
        onlyOwner
        inStatus(jobId, Status.Disputed)
    {
        Job storage job = jobs[jobId];

        if (refundClient) {
            // Full refund to client
            job.releasedAmount = 0;
            job.status = Status.Refunded;
            paymentToken.safeTransfer(job.client, job.amount);
            emit DisputeResolved(jobId, 0, job.amount, 0);
        } else {
            // Full release to freelancer (with platform fee)
            uint256 fee = (job.amount * feeBps) / 10_000;
            uint256 netAmount = job.amount - fee;
            job.releasedAmount = netAmount;
            job.status = Status.Released;
            accumulatedFees += fee;
            paymentToken.safeTransfer(job.freelancer, netAmount);

            // Mint SBT credential
            if (address(giglyCredential) != address(0)) {
                giglyCredential.mint(job.freelancer, DEFAULT_AUTOCLAIM_URI);
            }

            emit DisputeResolved(jobId, netAmount, 0, fee);
        }
    }

    /**
     * @notice Alias for resolveDispute(uint256, bool).
     */
    function resolveDisputeSimple(uint256 jobId, bool refundClient) external onlyOwner {
        resolveDispute(jobId, refundClient);
    }

    /**
     * @notice Withdraws accumulated platform fees to the configured treasury wallet.
     * @dev Only callable by the contract owner. Reverts if treasuryWallet is not set.
     */
    function withdrawFees() external nonReentrant onlyOwner {
        address to = treasuryWallet;
        if (to == address(0)) revert InvalidAddress();
        uint256 amount = accumulatedFees;
        if (amount == 0) revert InvalidAmount();

        accumulatedFees = 0;
        paymentToken.safeTransfer(to, amount);

        emit FeesWithdrawn(to, amount);
    }

    /**
     * @notice Withdraws accumulated platform fees to a specified address.
     * @dev Only callable by the contract owner.
     * @param to The address to send the accumulated fees to.
     */
    function withdrawFees(address to) external nonReentrant onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        uint256 amount = accumulatedFees;
        if (amount == 0) revert InvalidAmount();

        accumulatedFees = 0;
        paymentToken.safeTransfer(to, amount);

        emit FeesWithdrawn(to, amount);
    }

    // ─── Internal Helpers ────────────────────────────────────────────────

    /**
     * @notice Internal helper that calculates the fee, transfers net funds to the
     *         freelancer, and marks the job as Released.
     * @param jobId The ID of the job to release.
     * @param metadataURI The IPFS URI containing the credential metadata.
     */
    function _releaseFunds(uint256 jobId, string memory metadataURI) internal {
        Job storage job = jobs[jobId];
        uint256 fee = (job.amount * feeBps) / 10_000;
        uint256 netAmount = job.amount - fee;

        job.releasedAmount = netAmount;
        job.status = Status.Released;
        accumulatedFees += fee;

        paymentToken.safeTransfer(job.freelancer, netAmount);

        // Mint credential if configured
        if (address(giglyCredential) != address(0) && bytes(metadataURI).length > 0) {
            giglyCredential.mint(job.freelancer, metadataURI);
        }

        emit FundsReleased(jobId, netAmount, fee);
    }
}
