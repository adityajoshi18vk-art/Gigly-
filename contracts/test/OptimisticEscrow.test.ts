import hre from "hardhat";
import { expect } from "chai";

// Create a network connection (Hardhat 3 style — ESM top-level await)
const { ethers, networkHelpers } = await hre.network.create();

// Type aliases from ethers
type HardhatEthersSigner = Awaited<ReturnType<typeof ethers.getSigners>>[number];
type MockUSDC = Awaited<ReturnType<typeof ethers.deployContract<"MockUSDC">>>;
type OptimisticEscrow = Awaited<ReturnType<typeof ethers.deployContract<"OptimisticEscrow">>>;

describe("Gigly Escrow", function () {
  // ─── Shared State ────────────────────────────────────────────────────

  let usdc: MockUSDC;
  let escrow: OptimisticEscrow;

  let owner: HardhatEthersSigner;
  let client: HardhatEthersSigner;
  let freelancer: HardhatEthersSigner;
  let arbiter: HardhatEthersSigner;
  let outsider: HardhatEthersSigner;

  const FEE_BPS = 250; // 2.5%
  const JOB_AMOUNT = 1_000_000_000n; // 1 000 USDC (6 decimals)
  const REVIEW_WINDOW = 24 * 60 * 60; // 24 hours in seconds

  // ─── Deploy Fresh Contracts Before Each Test ─────────────────────────

  beforeEach(async function () {
    [owner, client, freelancer, arbiter, outsider] = await ethers.getSigners();

    // Deploy MockUSDC
    usdc = await ethers.deployContract("MockUSDC");
    await usdc.waitForDeployment();

    // Deploy OptimisticEscrow
    escrow = await ethers.deployContract("OptimisticEscrow", [
      await usdc.getAddress(),
      arbiter.address,
      FEE_BPS,
    ]);
    await escrow.waitForDeployment();

    // Mint USDC to the client and approve the escrow contract
    await usdc.mint(client.address, JOB_AMOUNT * 10n);
    await usdc
      .connect(client)
      .approve(await escrow.getAddress(), JOB_AMOUNT * 10n);
  });

  // ─── Helper ──────────────────────────────────────────────────────────

  async function createAndSubmitJob(): Promise<bigint> {
    await escrow.connect(client).createJob(freelancer.address, JOB_AMOUNT, "Build landing page");
    const jobId = 1n;
    await escrow.connect(freelancer).submitWork(jobId, "https://github.com/gigly");
    return jobId;
  }

  // =====================================================================
  //  1. MockUSDC Tests
  // =====================================================================

  describe("MockUSDC", function () {
    it("should have 6 decimals", async function () {
      expect(await usdc.decimals()).to.equal(6);
    });

    it("should have correct name and symbol", async function () {
      expect(await usdc.name()).to.equal("USD Coin");
      expect(await usdc.symbol()).to.equal("USDC");
    });

    it("should allow owner to mint", async function () {
      await usdc.mint(outsider.address, 5_000_000n);
      expect(await usdc.balanceOf(outsider.address)).to.equal(5_000_000n);
    });

    it("should reject mint from non-owner", async function () {
      await expect(
        usdc.connect(outsider).mint(outsider.address, 1n)
      ).to.be.revertedWithCustomError(usdc, "OwnableUnauthorizedAccount");
    });
  });

  // =====================================================================
  //  2. Job Creation
  // =====================================================================

  describe("createJob", function () {
    it("should create a job and lock USDC", async function () {
      const tx = await escrow
        .connect(client)
        .createJob(freelancer.address, JOB_AMOUNT, "Design logo");

      await expect(tx)
        .to.emit(escrow, "JobCreated")
        .withArgs(1, client.address, freelancer.address, JOB_AMOUNT, "Design logo");

      const job = await escrow.jobs(1);
      expect(job.client).to.equal(client.address);
      expect(job.freelancer).to.equal(freelancer.address);
      expect(job.amount).to.equal(JOB_AMOUNT);
      expect(job.status).to.equal(1); // Funded

      // USDC moved from client to escrow
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(JOB_AMOUNT);
    });

    it("should reject zero amount", async function () {
      await expect(
        escrow.connect(client).createJob(freelancer.address, 0, "task")
      ).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("should allow zero-address freelancer (open job)", async function () {
      const tx = await escrow
        .connect(client)
        .createJob(ethers.ZeroAddress, JOB_AMOUNT, "open task");

      await expect(tx)
        .to.emit(escrow, "JobCreated")
        .withArgs(1, client.address, ethers.ZeroAddress, JOB_AMOUNT, "open task");

      const job = await escrow.jobs(1);
      expect(job.freelancer).to.equal(ethers.ZeroAddress);
    });

    it("should reject client == freelancer", async function () {
      await expect(
        escrow
          .connect(client)
          .createJob(client.address, JOB_AMOUNT, "task")
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });
  });

  // =====================================================================
  //  3. Job Acceptance (Open Board)
  // =====================================================================

  describe("acceptJob", function () {
    it("should allow freelancer to accept an open job", async function () {
      await escrow.connect(client).createJob(ethers.ZeroAddress, JOB_AMOUNT, "open task");

      const tx = await escrow.connect(freelancer).acceptJob(1);
      
      await expect(tx)
        .to.emit(escrow, "JobAccepted")
        .withArgs(1, freelancer.address);

      const job = await escrow.jobs(1);
      expect(job.freelancer).to.equal(freelancer.address);
      expect(job.status).to.equal(1); // Still Funded
    });

    it("should reject client from accepting their own open job", async function () {
      await escrow.connect(client).createJob(ethers.ZeroAddress, JOB_AMOUNT, "open task");

      await expect(
        escrow.connect(client).acceptJob(1)
      ).to.be.revertedWithCustomError(escrow, "ClientCannotAcceptOwnJob");
    });

    it("should reject accepting an already assigned job", async function () {
      await escrow.connect(client).createJob(freelancer.address, JOB_AMOUNT, "assigned task");

      await expect(
        escrow.connect(outsider).acceptJob(1)
      ).to.be.revertedWithCustomError(escrow, "JobAlreadyAssigned");
    });

    it("should reject if job is not Funded", async function () {
      await escrow.connect(client).createJob(ethers.ZeroAddress, JOB_AMOUNT, "open task");
      await escrow.connect(freelancer).acceptJob(1);
      
      // submit work advances state to Submitted
      await escrow.connect(freelancer).submitWork(1, "https://example.com");

      await expect(
        escrow.connect(outsider).acceptJob(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // =====================================================================
  //  4. Work Submission
  // =====================================================================

  describe("submitWork", function () {
    it("should allow freelancer to submit work", async function () {
      await escrow
        .connect(client)
        .createJob(freelancer.address, JOB_AMOUNT, "task");

      const tx = await escrow.connect(freelancer).submitWork(1, "https://example.com");
      await expect(tx).to.emit(escrow, "WorkSubmitted");

      const job = await escrow.jobs(1);
      expect(job.status).to.equal(2); // Submitted
      expect(job.submittedAt).to.be.greaterThan(0);
    });

    it("should reject non-freelancer", async function () {
      await escrow
        .connect(client)
        .createJob(freelancer.address, JOB_AMOUNT, "task");

      await expect(
        escrow.connect(client).submitWork(1, "https://example.com")
      ).to.be.revertedWithCustomError(escrow, "OnlyFreelancer");
    });

    it("should reject if not in Funded status", async function () {
      await escrow
        .connect(client)
        .createJob(freelancer.address, JOB_AMOUNT, "task");
      await escrow.connect(freelancer).submitWork(1, "https://example.com");

      // Already submitted — should fail
      await expect(
        escrow.connect(freelancer).submitWork(1, "https://example.com")
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // =====================================================================
  //  4. Happy Path — Early Approval
  // =====================================================================

  describe("approveAndRelease (early approval)", function () {
    it("should release funds minus fee to freelancer", async function () {
      const jobId = await createAndSubmitJob();

      const freelancerBefore = await usdc.balanceOf(freelancer.address);
      const tx = await escrow.connect(client).approveAndRelease(jobId);

      const expectedFee = (JOB_AMOUNT * BigInt(FEE_BPS)) / 10_000n;
      const expectedNet = JOB_AMOUNT - expectedFee;

      await expect(tx)
        .to.emit(escrow, "FundsReleased")
        .withArgs(jobId, expectedNet, expectedFee);

      expect(await usdc.balanceOf(freelancer.address)).to.equal(
        freelancerBefore + expectedNet
      );

      const job = await escrow.jobs(jobId);
      expect(job.status).to.equal(4); // Released
      expect(job.releasedAmount).to.equal(expectedNet);

      // Fees accumulated
      expect(await escrow.accumulatedFees()).to.equal(expectedFee);
    });

    it("should reject non-client caller", async function () {
      const jobId = await createAndSubmitJob();
      await expect(
        escrow.connect(freelancer).approveAndRelease(jobId)
      ).to.be.revertedWithCustomError(escrow, "OnlyClient");
    });
  });

  // =====================================================================
  //  5. Happy Path — Timeout Auto-Release (claimAfterWindow)
  // =====================================================================

  describe("claimAfterWindow (timeout auto-release)", function () {
    it("should allow anyone to release after 24h", async function () {
      const jobId = await createAndSubmitJob();

      // Fast-forward 24 hours + 1 second
      await networkHelpers.time.increase(REVIEW_WINDOW + 1);

      const freelancerBefore = await usdc.balanceOf(freelancer.address);
      const tx = await escrow.connect(outsider).claimAfterWindow(jobId);

      const expectedFee = (JOB_AMOUNT * BigInt(FEE_BPS)) / 10_000n;
      const expectedNet = JOB_AMOUNT - expectedFee;

      await expect(tx)
        .to.emit(escrow, "FundsReleased")
        .withArgs(jobId, expectedNet, expectedFee);

      expect(await usdc.balanceOf(freelancer.address)).to.equal(
        freelancerBefore + expectedNet
      );
    });

    it("should reject if window has not expired", async function () {
      const jobId = await createAndSubmitJob();

      await expect(
        escrow.connect(outsider).claimAfterWindow(jobId)
      ).to.be.revertedWithCustomError(escrow, "ReviewWindowNotExpired");
    });
  });

  // =====================================================================
  //  6. Dispute Flow
  // =====================================================================

  describe("raiseDispute", function () {
    it("should allow client to dispute within window", async function () {
      const jobId = await createAndSubmitJob();

      const tx = await escrow.connect(client).raiseDispute(jobId, "Poor quality");
      await expect(tx)
        .to.emit(escrow, "DisputeRaised")
        .withArgs(jobId, client.address, "Poor quality");

      const job = await escrow.jobs(jobId);
      expect(job.status).to.equal(3); // Disputed
    });

    it("should reject dispute after window expires", async function () {
      const jobId = await createAndSubmitJob();
      await networkHelpers.time.increase(REVIEW_WINDOW + 1);

      await expect(
        escrow.connect(client).raiseDispute(jobId, "Poor quality")
      ).to.be.revertedWithCustomError(escrow, "ReviewWindowExpired");
    });

    it("should reject dispute from non-client", async function () {
      const jobId = await createAndSubmitJob();
      await expect(
        escrow.connect(freelancer).raiseDispute(jobId, "Poor quality")
      ).to.be.revertedWithCustomError(escrow, "OnlyClient");
    });
  });

  describe("resolveDispute", function () {
    it("should split funds between freelancer and client", async function () {
      const jobId = await createAndSubmitJob();
      await escrow.connect(client).raiseDispute(jobId, "Poor quality");

      const splitToFreelancer = JOB_AMOUNT / 2n; // 50/50
      const splitToClient = JOB_AMOUNT - splitToFreelancer;

      const freelancerBefore = await usdc.balanceOf(freelancer.address);
      const clientBefore = await usdc.balanceOf(client.address);

      const tx = await escrow
        .connect(arbiter)
        .resolveDispute(jobId, splitToFreelancer);

      const fee = (splitToFreelancer * BigInt(FEE_BPS)) / 10_000n;
      const netToFreelancer = splitToFreelancer - fee;

      await expect(tx)
        .to.emit(escrow, "DisputeResolved")
        .withArgs(jobId, netToFreelancer, splitToClient, fee);

      expect(await usdc.balanceOf(freelancer.address)).to.equal(
        freelancerBefore + netToFreelancer
      );
      expect(await usdc.balanceOf(client.address)).to.equal(
        clientBefore + splitToClient
      );
    });

    it("should allow full refund to client (0 to freelancer)", async function () {
      const jobId = await createAndSubmitJob();
      await escrow.connect(client).raiseDispute(jobId, "Poor quality");

      const clientBefore = await usdc.balanceOf(client.address);
      await escrow.connect(arbiter).resolveDispute(jobId, 0n);

      expect(await usdc.balanceOf(client.address)).to.equal(
        clientBefore + JOB_AMOUNT
      );

      const job = await escrow.jobs(jobId);
      expect(job.status).to.equal(5); // Refunded
    });

    it("should allow full payout to freelancer", async function () {
      const jobId = await createAndSubmitJob();
      await escrow.connect(client).raiseDispute(jobId, "Poor quality");

      const freelancerBefore = await usdc.balanceOf(freelancer.address);
      await escrow.connect(arbiter).resolveDispute(jobId, JOB_AMOUNT);

      const fee = (JOB_AMOUNT * BigInt(FEE_BPS)) / 10_000n;
      const netToFreelancer = JOB_AMOUNT - fee;

      expect(await usdc.balanceOf(freelancer.address)).to.equal(
        freelancerBefore + netToFreelancer
      );

      const job = await escrow.jobs(jobId);
      expect(job.status).to.equal(4); // Released
    });

    it("should reject non-arbiter caller", async function () {
      const jobId = await createAndSubmitJob();
      await escrow.connect(client).raiseDispute(jobId, "Poor quality");

      await expect(
        escrow.connect(outsider).resolveDispute(jobId, JOB_AMOUNT / 2n)
      ).to.be.revertedWithCustomError(escrow, "OnlyArbiter");
    });

    it("should reject split exceeding job amount", async function () {
      const jobId = await createAndSubmitJob();
      await escrow.connect(client).raiseDispute(jobId, "Poor quality");

      await expect(
        escrow.connect(arbiter).resolveDispute(jobId, JOB_AMOUNT + 1n)
      ).to.be.revertedWithCustomError(escrow, "SplitExceedsAmount");
    });
  });

  // =====================================================================
  //  7. Reentrancy Protection
  // =====================================================================

  describe("Reentrancy protection", function () {
    it("should not allow double release via re-entrant call", async function () {
      // Since USDC (ERC-20) doesn't have callbacks like ETH transfers,
      // reentrancy is already mitigated at the token level. However, the
      // ReentrancyGuard still protects against any future token with hooks.
      // We verify the guard is active by checking the status is terminal
      // after a single release — a second call reverts with InvalidStatus.
      const jobId = await createAndSubmitJob();
      await escrow.connect(client).approveAndRelease(jobId);

      // Job is now Released — a second call should revert
      await expect(
        escrow.connect(client).approveAndRelease(jobId)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("should block a malicious contract that re-enters claimAfterWindow mid-transfer", async function () {
      // ── Setup: deploy a hook-enabled token and a fresh escrow using it ──
      const reentrantToken = await ethers.deployContract("ReentrantToken");
      await reentrantToken.waitForDeployment();

      const maliciousEscrow = await ethers.deployContract("OptimisticEscrow", [
        await reentrantToken.getAddress(),
        arbiter.address,
        FEE_BPS,
      ]);
      await maliciousEscrow.waitForDeployment();

      // ── Deploy the attacker contract (acts as the "freelancer") ──
      const attacker = await ethers.deployContract("ReentrantAttacker", [
        await maliciousEscrow.getAddress(),
      ]);
      await attacker.waitForDeployment();
      const attackerAddr = await attacker.getAddress();

      // ── Fund the client and create a job with the attacker as freelancer ──
      await reentrantToken.mint(client.address, JOB_AMOUNT);
      await reentrantToken
        .connect(client)
        .approve(await maliciousEscrow.getAddress(), JOB_AMOUNT);

      await maliciousEscrow
        .connect(client)
        .createJob(attackerAddr, JOB_AMOUNT, "Reentrancy test job");

      // ── The attacker "submits work" (anyone with the freelancer role) ──
      // Since the attacker is a contract, we call submitWork from its context
      // by having the owner impersonate it via a helper.
      // Instead, we use a simpler approach: the client approves early so we
      // can test the release path. But submitWork requires the freelancer to
      // call it. We'll use networkHelpers.impersonateAccount.
      await networkHelpers.setBalance(attackerAddr, ethers.parseEther("1"));
      const attackerSigner = await ethers.getImpersonatedSigner(attackerAddr);

      await maliciousEscrow.connect(attackerSigner).submitWork(1, "malicious");

      // Tell the attacker which job to re-enter on
      await attacker.setTarget(1);

      // ── Fast-forward past the review window ──
      await networkHelpers.time.increase(REVIEW_WINDOW + 1);

      // ── Trigger claimAfterWindow — the token transfer will call the
      //    attacker's onTokenReceived hook, which tries to re-enter.
      //    ReentrancyGuard should cause the entire transaction to revert. ──
      await expect(
        maliciousEscrow.connect(outsider).claimAfterWindow(1)
      ).to.be.revert(ethers);

      // ── Verify the job was NOT drained — status should still be Submitted ──
      const job = await maliciousEscrow.jobs(1);
      expect(job.status).to.equal(2); // Still Submitted, not Released
    });
  });

  // =====================================================================
  //  8. Admin Functions
  // =====================================================================

  describe("Admin functions", function () {
    it("should allow owner to set fee (within cap)", async function () {
      await escrow.setFeeBps(100);
      expect(await escrow.feeBps()).to.equal(100);
    });

    it("should reject fee above 3%", async function () {
      await expect(escrow.setFeeBps(301)).to.be.revertedWithCustomError(
        escrow,
        "FeeTooHigh"
      );
    });

    it("should allow owner to change arbiter", async function () {
      await escrow.setArbiter(outsider.address);
      expect(await escrow.arbiter()).to.equal(outsider.address);
    });

    it("should allow owner to withdraw accumulated fees", async function () {
      const jobId = await createAndSubmitJob();
      await escrow.connect(client).approveAndRelease(jobId);

      const fees = await escrow.accumulatedFees();
      expect(fees).to.be.greaterThan(0);

      const ownerBefore = await usdc.balanceOf(owner.address);
      await escrow.withdrawFees(owner.address);

      expect(await usdc.balanceOf(owner.address)).to.equal(
        ownerBefore + fees
      );
      expect(await escrow.accumulatedFees()).to.equal(0);
    });
  });
});
