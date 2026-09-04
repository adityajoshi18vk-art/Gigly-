// scripts/deploy_registry.ts
// ─── FreelancerRegistry Deploy Script ────────────────────────────────────────
// Deploys FreelancerRegistry.sol — standalone, no wiring needed.
//
// Usage:
//   npx hardhat run scripts/deploy_registry.ts --network sepolia
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import * as fs from "fs";
import { network } from "hardhat";

const { ethers, networkName } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("══════════════════════════════════════════════════");
console.log("  📋  Gigly — FreelancerRegistry Deployment");
console.log(`  Network  : ${networkName}`);
console.log(`  Deployer : ${deployer.address}`);
console.log("══════════════════════════════════════════════════\n");

console.log("📄 Deploying FreelancerRegistry...");
const registry = await ethers.deployContract("FreelancerRegistry");
await registry.waitForDeployment();
const addr = await registry.getAddress();
console.log(`   ✅ FreelancerRegistry deployed at: ${addr}\n`);

// Update deployed.json
const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf-8"));
fs.writeFileSync("deployed.json", JSON.stringify({ ...deployed, FreelancerRegistry: addr }, null, 2));
console.log("   ✅ deployed.json updated\n");

console.log("══════════════════════════════════════════════════");
console.log("  ✅ FreelancerRegistry Deployment Complete!");
console.log("──────────────────────────────────────────────────");
console.log(`  FreelancerRegistry : ${addr}`);
console.log("══════════════════════════════════════════════════");
console.log("\n💡 Update CONTRACTS.FreelancerRegistry in frontend/src/lib/config.ts!");
