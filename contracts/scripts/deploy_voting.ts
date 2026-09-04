// scripts/deploy_voting.ts
// ─── VotingDispute Deploy Script ──────────────────────────────────
// Deploys VotingDispute.sol and wires it up to the existing
// GiglyCredential and OptimisticEscrow contracts.
//
// Pre-requisites:
//   - GiglyCredential deployed   → set CREDENTIAL_ADDRESS in .env
//   - OptimisticEscrow deployed  → set ESCROW_ADDRESS in .env
//   - Deployer key must be the owner of both contracts
//
// Usage:
//   npx hardhat run scripts/deploy_voting.ts --network sepolia
// ──────────────────────────────────────────────────────────────────

import "dotenv/config";
import { network } from "hardhat";

const { ethers, networkName } = await network.create();

const ESCROW_ADDRESS      = process.env.ESCROW_ADDRESS      || "";
const CREDENTIAL_ADDRESS  = process.env.CREDENTIAL_ADDRESS  || "";

if (!ESCROW_ADDRESS || !CREDENTIAL_ADDRESS) {
  console.error("❌ Set ESCROW_ADDRESS and CREDENTIAL_ADDRESS in .env");
  process.exit(1);
}

console.log("══════════════════════════════════════════════════");
console.log("  🗳️  Gigly — VotingDispute Deployment");
console.log(`  Network    : ${networkName}`);
console.log(`  Escrow     : ${ESCROW_ADDRESS}`);
console.log(`  Credential : ${CREDENTIAL_ADDRESS}`);
console.log("══════════════════════════════════════════════════\n");

// ─── Deploy VotingDispute ─────────────────────────────────────────

console.log("📄 Deploying VotingDispute...");
const votingDispute = await ethers.deployContract("VotingDispute", [
  ESCROW_ADDRESS,
  CREDENTIAL_ADDRESS,
]);
await votingDispute.waitForDeployment();
const votingAddress = await votingDispute.getAddress();
console.log(`   ✅ VotingDispute deployed at: ${votingAddress}\n`);

// ─── Wire up GiglyCredential ──────────────────────────────────────

console.log("🔗 Authorising VotingDispute as minter on GiglyCredential...");
const credential = await ethers.getContractAt("GiglyCredential", CREDENTIAL_ADDRESS);
const tx1 = await credential.setVotingDisputeContract(votingAddress);
await tx1.wait();
console.log(`   ✅ Done!\n`);

// ─── Wire up OptimisticEscrow — set VotingDispute as arbiter ─────

console.log("🔗 Setting VotingDispute as arbiter on OptimisticEscrow...");
const escrow = await ethers.getContractAt("OptimisticEscrow", ESCROW_ADDRESS);
const tx2 = await escrow.setArbiter(votingAddress);
await tx2.wait();
console.log(`   ✅ Done!\n`);

// ─── Summary ─────────────────────────────────────────────────────

console.log("══════════════════════════════════════════════════");
console.log("  ✅ VotingDispute Deployment Complete!");
console.log("──────────────────────────────────────────────────");
console.log(`  VotingDispute : ${votingAddress}`);
console.log(`  Escrow arbiter set to VotingDispute`);
console.log(`  Credential minter includes VotingDispute`);
console.log("══════════════════════════════════════════════════");
console.log("\n💡 Update CONTRACTS.VotingDispute in frontend/src/lib/config.ts!");
