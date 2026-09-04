import "dotenv/config";
import * as fs from "fs";
import { network } from "hardhat";

const ESCROW_ADDR     = "0x80C53026081b2710b0e2705332790322DC7e7300";
const NEW_CREDENTIAL  = "0x7CbC2961526453E48154Bc5A045bc254Eb61B46C";
const LEGACY_CRED     = "0xFB43c1182F51583d33E2e191DB32025DE115ea75";

const { ethers, networkName } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("══════════════════════════════════════════════════");
console.log("  🚀 Redeploying VotingDispute with Fallback Juror Picker");
console.log(`  Network     : ${networkName}`);
console.log(`  Deployer    : ${deployer.address}`);
console.log(`  Escrow      : ${ESCROW_ADDR}`);
console.log(`  Credential  : ${NEW_CREDENTIAL}`);
console.log(`  Legacy Cred : ${LEGACY_CRED}`);
console.log("══════════════════════════════════════════════════\n");

console.log("📄 Deploying new VotingDispute...");
const voting = await ethers.deployContract("VotingDispute", [
  ESCROW_ADDR,
  NEW_CREDENTIAL,
]);
await voting.waitForDeployment();
const votingAddr = await voting.getAddress();
console.log(`   ✅ VotingDispute: ${votingAddr}\n`);

console.log("🔗 Wiring GiglyCredential → VotingDispute (minter)...");
const cred = await ethers.getContractAt("GiglyCredential", NEW_CREDENTIAL);
await (await cred.setVotingDisputeContract(votingAddr)).wait();
console.log("   ✅");

console.log("🔗 Setting legacy credential on VotingDispute...");
await (await voting.setLegacyCredential(LEGACY_CRED)).wait();
console.log("   ✅");

console.log("🔗 Setting VotingDispute as arbiter on escrow...");
const escrow = await ethers.getContractAt("OptimisticEscrow", ESCROW_ADDR);
await (await escrow.setArbiter(votingAddr)).wait();
console.log("   ✅\n");

// Update deployed.json
const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf-8"));
fs.writeFileSync("deployed.json", JSON.stringify({
  ...deployed,
  OptimisticEscrow: ESCROW_ADDR,
  VotingDispute: votingAddr,
}, null, 2));

console.log("══════════════════════════════════════════════════");
console.log(`VotingDispute : ${votingAddr}`);
console.log("══════════════════════════════════════════════════");
