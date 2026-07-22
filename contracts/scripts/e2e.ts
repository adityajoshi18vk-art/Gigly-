// scripts/e2e.ts
// ─── Gigly End-to-End Local Test Script ───────────────────────────
// Runs a full happy-path flow against the local hardhat node using
// the deployed contracts.
//
// Usage:
//   npx hardhat run scripts/e2e.ts
// ──────────────────────────────────────────────────────────────────

import "dotenv/config";
import { network } from "hardhat";
import * as fs from "fs";

async function main() {
  const { ethers } = await network.create();

  if (!fs.existsSync("deployed.json")) {
    console.error("❌ deployed.json not found. Run deploy.ts first.");
    process.exit(1);
  }

  const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  console.log("Loaded deployed addresses from deployed.json");

  const signers = await ethers.getSigners();
  const owner = signers[0]; // deployer / arbiter
  const client = signers[1];
  const freelancer = signers[2];

  console.log(`\nActors:
  Owner/Arbiter : ${owner.address}
  Client        : ${client.address}
  Freelancer    : ${freelancer.address}`);

  // Attach to contracts
  const usdc = await ethers.getContractAt("MockUSDC", deployed.MockUSDC);
  const escrow = await ethers.getContractAt("OptimisticEscrow", deployed.OptimisticEscrow);

  const JOB_AMOUNT = 1_000_000_000n; // 1,000 USDC

  // 1. Setup: Mint and Approve USDC
  console.log("\n[1] Minting USDC to Client...");
  await usdc.mint(client.address, JOB_AMOUNT * 2n);
  
  console.log("[1] Client approving Escrow contract...");
  await usdc.connect(client).approve(deployed.OptimisticEscrow, JOB_AMOUNT);

  // 2. Create Job
  console.log("\n[2] Client creating Job...");
  const createTx = await escrow.connect(client).createJob(
    freelancer.address,
    JOB_AMOUNT,
    "Build a Landing Page"
  );
  await createTx.wait();
  
  const jobId = 1; // It's the first job
  console.log(`    ✅ Job Created! ID: ${jobId}`);

  // 3. Submit Work
  console.log("\n[3] Freelancer submitting work...");
  const submitTx = await escrow.connect(freelancer).submitWork(jobId);
  await submitTx.wait();
  console.log("    ✅ Work Submitted!");

  // 4. Approve & Release
  console.log("\n[4] Client approving and releasing funds early...");
  const releaseTx = await escrow.connect(client).approveAndRelease(jobId);
  await releaseTx.wait();
  console.log("    ✅ Funds Released!");

  // 5. Final Balances
  console.log("\n[5] Final Balances:");
  const clientBal = await usdc.balanceOf(client.address);
  const freelancerBal = await usdc.balanceOf(freelancer.address);
  const escrowBal = await escrow.accumulatedFees();
  
  console.log(`    Client USDC     : ${ethers.formatUnits(clientBal, 6)}`);
  console.log(`    Freelancer USDC : ${ethers.formatUnits(freelancerBal, 6)}`);
  console.log(`    Platform Fees   : ${ethers.formatUnits(escrowBal, 6)}`);
  console.log("\n🎉 End-to-End Test Completed Successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
