// scripts/deploy.ts
// ─── Gigly Deploy Script ──────────────────────────────────────────
// Deploys OptimisticEscrow to Sepolia using the official Circle
// Testnet USDC as the payment token (no custom MockUSDC needed).
//
// Usage:
//   npx hardhat run scripts/deploy.ts --network sepolia
// ──────────────────────────────────────────────────────────────────

import * as fs from "fs";
import "dotenv/config";
import { network } from "hardhat";

const { ethers, networkName } = await network.create();

// ─── Official Circle Testnet USDC on Sepolia ─────────────────────
// Source: https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// ─── Config ──────────────────────────────────────────────────────

let ARBITER_ADDRESS = process.env.ARBITER_ADDRESS;
const FEE_BPS = parseInt(process.env.FEE_BPS || "250", 10);

if (networkName === "localhost" || networkName === "hardhat") {
  const signers = await ethers.getSigners();
  ARBITER_ADDRESS = signers[0].address;
}

if (!ARBITER_ADDRESS || ARBITER_ADDRESS === "0x0000000000000000000000000000000000000000") {
  console.error("❌ ARBITER_ADDRESS is not set in .env — please set it to a valid wallet address.");
  process.exit(1);
}

console.log("══════════════════════════════════════════════════");
console.log("  🚀 Gigly — Contract Deployment");
console.log(`  Network  : ${networkName}`);
console.log(`  USDC     : ${SEPOLIA_USDC}  (Circle Testnet)`);
console.log(`  Arbiter  : ${ARBITER_ADDRESS}`);
console.log(`  Fee      : ${FEE_BPS} bps (${(FEE_BPS / 100).toFixed(1)}%)`);
console.log("══════════════════════════════════════════════════\n");

// ─── Deploy GiglyCredential ──────────────────────────────────────

console.log("📄 Deploying GiglyCredential (SBT)...");
const credential = await ethers.deployContract("GiglyCredential");
await credential.waitForDeployment();
const credentialAddress = await credential.getAddress();
console.log(`   ✅ GiglyCredential deployed at: ${credentialAddress}\n`);

// ─── Deploy OptimisticEscrow (points to official testnet USDC) ───

console.log("📄 Deploying OptimisticEscrow...");
const escrow = await ethers.deployContract("OptimisticEscrow", [
  SEPOLIA_USDC,
  ARBITER_ADDRESS,
  FEE_BPS,
]);
await escrow.waitForDeployment();
const escrowAddress = await escrow.getAddress();
console.log(`   ✅ OptimisticEscrow deployed at: ${escrowAddress}\n`);

// ─── Link Contracts ──────────────────────────────────────────────
console.log("🔗 Linking contracts...");
const tx1 = await credential.setOptimisticEscrow(escrowAddress);
await tx1.wait();
const tx2 = await escrow.setGiglyCredential(credentialAddress);
await tx2.wait();
console.log(`   ✅ Linked successfully!\n`);

// ─── Save Addresses ──────────────────────────────────────────────

fs.writeFileSync("deployed.json", JSON.stringify({
  USDC: SEPOLIA_USDC,
  GiglyCredential: credentialAddress,
  OptimisticEscrow: escrowAddress,
  Network: networkName,
}, null, 2));

// ─── Summary ─────────────────────────────────────────────────────

console.log("══════════════════════════════════════════════════");
console.log("  ✅ Deployment Complete!");
console.log("──────────────────────────────────────────────────");
console.log(`  Circle Testnet USDC : ${SEPOLIA_USDC}`);
console.log(`  GiglyCredential     : ${credentialAddress}`);
console.log(`  OptimisticEscrow    : ${escrowAddress}`);
console.log(`  Arbiter             : ${ARBITER_ADDRESS}`);
console.log(`  Fee                 : ${FEE_BPS} bps`);
console.log("══════════════════════════════════════════════════");
console.log("\n💡 Update CONTRACTS in frontend/src/lib/config.ts with the new addresses!");
