// scripts/redeploy_escrow.ts
// ─── Redeploy only OptimisticEscrow (keeps MockUSDC) ──────────────
//
// Usage:
//   npx hardhat run scripts/redeploy_escrow.ts --network sepolia
// ──────────────────────────────────────────────────────────────────

import * as fs from "fs";
import "dotenv/config";
import { network } from "hardhat";

const { ethers, networkName } = await network.create();

// ─── Config ──────────────────────────────────────────────────────

const ARBITER_ADDRESS = process.env.ARBITER_ADDRESS;
const FEE_BPS = parseInt(process.env.FEE_BPS || "250", 10);

// Read existing deployed.json to get MockUSDC address
const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
const usdcAddress = deployed.MockUSDC;

if (!usdcAddress) {
  console.error("❌ MockUSDC address not found in deployed.json");
  process.exit(1);
}

if (!ARBITER_ADDRESS || ARBITER_ADDRESS === "0x0000000000000000000000000000000000000000") {
  console.error("❌ ARBITER_ADDRESS is not set in .env");
  process.exit(1);
}

console.log("══════════════════════════════════════════════════");
console.log("  🚀 Gigly — Escrow Re-deployment");
console.log(`  Network  : ${networkName}`);
console.log(`  MockUSDC : ${usdcAddress} (existing)`);
console.log(`  Arbiter  : ${ARBITER_ADDRESS}`);
console.log(`  Fee      : ${FEE_BPS} bps (${(FEE_BPS / 100).toFixed(1)}%)`);
console.log("══════════════════════════════════════════════════\n");

// ─── Compile & Deploy OptimisticEscrow ───────────────────────────

console.log("📄 Deploying new OptimisticEscrow...");
const escrow = await ethers.deployContract("OptimisticEscrow", [
  usdcAddress,
  ARBITER_ADDRESS,
  FEE_BPS,
]);
await escrow.waitForDeployment();
const escrowAddress = await escrow.getAddress();

// Get the deployment block number
const provider = ethers.provider;
const blockNumber = await provider.getBlockNumber();

console.log(`   ✅ OptimisticEscrow deployed at: ${escrowAddress}`);
console.log(`   📦 Deployment block: ${blockNumber}\n`);

// ─── Update deployed.json ────────────────────────────────────────

deployed.OptimisticEscrow = escrowAddress;
deployed.Network = networkName;
deployed.DeploymentBlock = blockNumber;
fs.writeFileSync("deployed.json", JSON.stringify(deployed, null, 2));

// ─── Summary ─────────────────────────────────────────────────────

console.log("══════════════════════════════════════════════════");
console.log("  ✅ Re-deployment Complete!");
console.log("──────────────────────────────────────────────────");
console.log(`  MockUSDC          : ${usdcAddress} (unchanged)`);
console.log(`  OptimisticEscrow  : ${escrowAddress} (NEW)`);
console.log(`  Deployment Block  : ${blockNumber}`);
console.log("══════════════════════════════════════════════════");
console.log("\n💡 Update frontend/src/lib/config.ts with the new escrow address and block number.");
