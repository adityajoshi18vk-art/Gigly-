// scripts/deploy.ts
// ─── Gigly Deploy Script ──────────────────────────────────────────
// Deploys MockUSDC and OptimisticEscrow to the selected network.
//
// Usage:
//   npx hardhat run scripts/deploy.ts --network polygonAmoy
// ──────────────────────────────────────────────────────────────────

import * as fs from "fs";
import "dotenv/config";
import { network } from "hardhat";

const { ethers, networkName } = await network.create();

// ─── Config ──────────────────────────────────────────────────────

let ARBITER_ADDRESS = process.env.ARBITER_ADDRESS;
const FEE_BPS = parseInt(process.env.FEE_BPS || "250", 10);

if (networkName === "localhost" || networkName === "hardhat") {
  const signers = await ethers.getSigners();
  ARBITER_ADDRESS = signers[0].address; // Use deployer as arbiter locally
}

if (!ARBITER_ADDRESS || ARBITER_ADDRESS === "0x0000000000000000000000000000000000000000") {
  console.error("❌ ARBITER_ADDRESS is not set in .env — please set it to a valid wallet address.");
  process.exit(1);
}

console.log("══════════════════════════════════════════════════");
console.log("  🚀 Gigly — Contract Deployment");
console.log(`  Network : ${networkName}`);
console.log(`  Arbiter : ${ARBITER_ADDRESS}`);
console.log(`  Fee     : ${FEE_BPS} bps (${(FEE_BPS / 100).toFixed(1)}%)`);
console.log("══════════════════════════════════════════════════\n");

// ─── 1. Deploy MockUSDC ──────────────────────────────────────────

console.log("📄 Deploying MockUSDC...");
const usdc = await ethers.deployContract("MockUSDC");
await usdc.waitForDeployment();
const usdcAddress = await usdc.getAddress();
console.log(`   ✅ MockUSDC deployed at: ${usdcAddress}\n`);

// ─── 2. Deploy OptimisticEscrow ──────────────────────────────────

console.log("📄 Deploying OptimisticEscrow...");
const escrow = await ethers.deployContract("OptimisticEscrow", [
  usdcAddress,
  ARBITER_ADDRESS,
  FEE_BPS,
]);
await escrow.waitForDeployment();
const escrowAddress = await escrow.getAddress();
console.log(`   ✅ OptimisticEscrow deployed at: ${escrowAddress}\n`);

// ─── Save Addresses ──────────────────────────────────────────────

fs.writeFileSync("deployed.json", JSON.stringify({
  MockUSDC: usdcAddress,
  OptimisticEscrow: escrowAddress,
  Network: networkName
}, null, 2));

// ─── Summary ─────────────────────────────────────────────────────

console.log("══════════════════════════════════════════════════");
console.log("  ✅ Deployment Complete!");
console.log("──────────────────────────────────────────────────");
console.log(`  MockUSDC          : ${usdcAddress}`);
console.log(`  OptimisticEscrow  : ${escrowAddress}`);
console.log(`  Arbiter           : ${ARBITER_ADDRESS}`);
console.log(`  Fee               : ${FEE_BPS} bps`);
console.log("══════════════════════════════════════════════════");
console.log("\n💡 Save these addresses — you'll need them for the frontend config.");
