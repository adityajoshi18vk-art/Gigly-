// scripts/redeploy_credential.ts
// Redeploys GiglyCredential with the updated ABI (dual minter support),
// wires it to OptimisticEscrow and VotingDispute.
import "dotenv/config";
import * as fs from "fs";
import { network } from "hardhat";

const ESCROW         = process.env.ESCROW_ADDRESS      || "0x4B60d9531fCF480edc6cE7FAfF27A171e61bA672";
const VOTING_DISPUTE = process.env.VOTING_DISPUTE_ADDRESS || "0xbaE78ef2777959fE419De8a28Ed1D974216279D2";

const { ethers, networkName } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("══════════════════════════════════════════════════");
console.log("  🚀 Redeploy GiglyCredential (dual-minter ABI)");
console.log(`  Network       : ${networkName}`);
console.log(`  Deployer      : ${deployer.address}`);
console.log(`  Escrow        : ${ESCROW}`);
console.log(`  VotingDispute : ${VOTING_DISPUTE}`);
console.log("══════════════════════════════════════════════════\n");

// 1. Deploy new GiglyCredential
console.log("📄 Deploying new GiglyCredential...");
const credential = await ethers.deployContract("GiglyCredential");
await credential.waitForDeployment();
const credentialAddress = await credential.getAddress();
console.log(`   ✅ GiglyCredential deployed at: ${credentialAddress}\n`);

// 2. Wire: set OptimisticEscrow as minter
console.log("🔗 Setting OptimisticEscrow as minter...");
const tx1 = await credential.setOptimisticEscrow(ESCROW);
await tx1.wait();
console.log("   ✅ Done!");

// 3. Wire: set VotingDispute as minter
console.log("🔗 Setting VotingDispute as minter...");
const tx2 = await credential.setVotingDisputeContract(VOTING_DISPUTE);
await tx2.wait();
console.log("   ✅ Done!");

// 4. Wire: update OptimisticEscrow to point to new credential
console.log("🔗 Updating OptimisticEscrow → new GiglyCredential...");
const escrow = await ethers.getContractAt("OptimisticEscrow", ESCROW);
const tx3 = await escrow.setGiglyCredential(credentialAddress);
await tx3.wait();
console.log("   ✅ Done!");

// 5. Wire: update VotingDispute to point to new credential
console.log("🔗 Updating VotingDispute → new GiglyCredential...");
const voting = await ethers.getContractAt("VotingDispute", VOTING_DISPUTE);
const tx4 = await voting.setCredential(credentialAddress);
await tx4.wait();
console.log("   ✅ Done!\n");

// 6. Save to deployed.json
const existing = JSON.parse(fs.readFileSync("deployed.json", "utf-8"));
fs.writeFileSync("deployed.json", JSON.stringify({
  ...existing,
  GiglyCredential: credentialAddress,
}, null, 2));

console.log("══════════════════════════════════════════════════");
console.log("  ✅ Redeployment Complete!");
console.log("──────────────────────────────────────────────────");
console.log(`  New GiglyCredential : ${credentialAddress}`);
console.log("══════════════════════════════════════════════════");
console.log("\n💡 Update in frontend/src/lib/config.ts:");
console.log(`   GiglyCredential: "${credentialAddress}",`);
console.log(`   VotingDispute:   "0xbaE78ef2777959fE419De8a28Ed1D974216279D2",`);
