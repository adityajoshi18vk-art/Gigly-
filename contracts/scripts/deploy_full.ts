// deploy_full.ts — Deploy fresh OptimisticEscrow + wire everything
import "dotenv/config";
import * as fs from "fs";
import { network } from "hardhat";

const NEW_CREDENTIAL   = "0x7CbC2961526453E48154Bc5A045bc254Eb61B46C";
const VOTING_DISPUTE   = "0xbaE78ef2777959fE419De8a28Ed1D974216279D2";
const USDC             = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const ARBITER_ADDRESS  = process.env.ARBITER_ADDRESS || "";
const FEE_BPS          = Number(process.env.FEE_BPS ?? 250);

const { ethers, networkName } = await network.create();
const [deployer] = await ethers.getSigners();

if (!ARBITER_ADDRESS) { console.error("❌ Set ARBITER_ADDRESS in .env"); process.exit(1); }

console.log("══════════════════════════════════════════════════");
console.log("  🚀 Deploy fresh OptimisticEscrow");
console.log(`  Network     : ${networkName}`);
console.log(`  Deployer    : ${deployer.address}`);
console.log(`  USDC        : ${USDC}`);
console.log(`  Credential  : ${NEW_CREDENTIAL}`);
console.log(`  Arbiter     : ${ARBITER_ADDRESS}`);
console.log(`  Fee (bps)   : ${FEE_BPS}`);
console.log("══════════════════════════════════════════════════\n");

// 1. Deploy new OptimisticEscrow
console.log("📄 Deploying new OptimisticEscrow...");
const escrow = await ethers.deployContract("OptimisticEscrow", [
  USDC,
  ARBITER_ADDRESS,
  FEE_BPS,
]);
await escrow.waitForDeployment();
const escrowAddress = await escrow.getAddress();
console.log(`   ✅ OptimisticEscrow deployed at: ${escrowAddress}\n`);

// 2. Wire escrow → new credential (setGiglyCredential)
console.log("🔗 Wiring escrow → GiglyCredential...");
const tx1 = await escrow.setGiglyCredential(NEW_CREDENTIAL);
await tx1.wait();
console.log("   ✅ Done!");

// 3. Wire new credential → escrow (setOptimisticEscrow)
console.log("🔗 Wiring GiglyCredential → new escrow...");
const credential = await ethers.getContractAt("GiglyCredential", NEW_CREDENTIAL);
const tx2 = await credential.setOptimisticEscrow(escrowAddress);
await tx2.wait();
console.log("   ✅ Done!");

// 4. Update VotingDispute → new escrow
console.log("🔗 Updating VotingDispute → new escrow...");
const voting = await ethers.getContractAt("VotingDispute", VOTING_DISPUTE);
const tx3 = await voting.setEscrow(escrowAddress);
await tx3.wait();
console.log("   ✅ Done!");

// 5. Set VotingDispute as arbiter on NEW escrow
console.log("🔗 Setting VotingDispute as arbiter on new escrow...");
const tx4 = await escrow.setArbiter(VOTING_DISPUTE);
await tx4.wait();
console.log("   ✅ Done!\n");

// 6. Persist to deployed.json
const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf-8"));
fs.writeFileSync("deployed.json", JSON.stringify({
  ...deployed,
  OptimisticEscrow: escrowAddress,
  GiglyCredential: NEW_CREDENTIAL,
  VotingDispute: VOTING_DISPUTE,
}, null, 2));

console.log("══════════════════════════════════════════════════");
console.log("  ✅ Deployment Complete!");
console.log("──────────────────────────────────────────────────");
console.log(`  OptimisticEscrow : ${escrowAddress}`);
console.log(`  GiglyCredential  : ${NEW_CREDENTIAL}`);
console.log(`  VotingDispute    : ${VOTING_DISPUTE}`);
console.log("══════════════════════════════════════════════════");
console.log("\n💡 Update frontend/src/lib/config.ts:");
console.log(`   OptimisticEscrow: "${escrowAddress}",`);
