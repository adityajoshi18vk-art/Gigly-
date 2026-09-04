import "dotenv/config";
import { network } from "hardhat";

// ─── Addresses ───────────────────────────────────────────────────────────────
const ESCROW          = "0x4B60d9531fCF480edc6cE7FAfF27A171e61bA672";
const CREDENTIAL      = "0xFB43c1182F51583d33E2e191DB32025DE115ea75";
const VOTING_DISPUTE  = "0xbaE78ef2777959fE419De8a28Ed1D974216279D2";

const { ethers, networkName } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("══════════════════════════════════════════════════");
console.log("  🔗 Gigly — Wire VotingDispute");
console.log(`  Network        : ${networkName}`);
console.log(`  Deployer       : ${deployer.address}`);
console.log(`  VotingDispute  : ${VOTING_DISPUTE}`);
console.log("══════════════════════════════════════════════════\n");

// Try setVotingDisputeContract on GiglyCredential
try {
  console.log("Step 1: setVotingDisputeContract on GiglyCredential...");
  const credential = await ethers.getContractAt("GiglyCredential", CREDENTIAL);
  // Check if function exists on-chain by reading votingDisputeContract slot
  try {
    const current = await credential.votingDisputeContract();
    console.log("  Current votingDisputeContract:", current);
    if (current.toLowerCase() === VOTING_DISPUTE.toLowerCase()) {
      console.log("  ✅ Already set! Skipping.");
    } else {
      const tx = await credential.setVotingDisputeContract(VOTING_DISPUTE);
      await tx.wait();
      console.log("  ✅ Done!\n");
    }
  } catch (e) {
    console.log("  ⚠️  GiglyCredential does NOT have setVotingDisputeContract — needs redeployment.");
    console.log("  Run: node_modules/.bin/hardhat run scripts/redeploy_credential.ts --network sepolia");
  }
} catch(e) {
  console.error("  ❌ Failed:", e);
}

// Set VotingDispute as arbiter on OptimisticEscrow
try {
  console.log("Step 2: setArbiter on OptimisticEscrow...");
  const escrow = await ethers.getContractAt("OptimisticEscrow", ESCROW);
  const current = await escrow.arbiter();
  console.log("  Current arbiter:", current);
  if (current.toLowerCase() === VOTING_DISPUTE.toLowerCase()) {
    console.log("  ✅ Already set! Skipping.");
  } else {
    const tx = await escrow.setArbiter(VOTING_DISPUTE);
    await tx.wait();
    console.log("  ✅ Done!\n");
  }
} catch(e) {
  console.error("  ❌ Failed:", e);
}

console.log("══════════════════════════════════════════════════");
console.log("  ✅ Wiring complete!");
console.log("══════════════════════════════════════════════════");
