import "dotenv/config";
import * as fs from "fs";
import { network } from "hardhat";

const USDC            = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const NEW_CREDENTIAL  = "0x7CbC2961526453E48154Bc5A045bc254Eb61B46C";
const LEGACY_CRED     = "0xFB43c1182F51583d33E2e191DB32025DE115ea75";
const ARBITER_ADDR    = process.env.ARBITER_ADDRESS || "";
const FEE_BPS         = Number(process.env.FEE_BPS ?? 250);

const JURORS = [
  "0x107333eEb914b1f11a0fD4541c2E14A55304Df8C",
  "0x47A073f356aF6dC0c5DfAFC88704A4C09551f664",
  "0x0F398204A9D9DDEa7d1b353fBb0b17C89d37D1eA",
];

const { ethers, networkName } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("══════════════════════════════════════════════════");
console.log("  🚀 Fresh Full Deployment + Juror Auto-Registration");
console.log(`  Network     : ${networkName}`);
console.log(`  Deployer    : ${deployer.address}`);
console.log(`  USDC        : ${USDC}`);
console.log(`  Credential  : ${NEW_CREDENTIAL}`);
console.log(`  Legacy Cred : ${LEGACY_CRED}`);
console.log(`  Jurors      : ${JURORS.join(", ")}`);
console.log("══════════════════════════════════════════════════\n");

// 1. Deploy OptimisticEscrow
console.log("📄 Deploying OptimisticEscrow (with 24h reviewWindow)...");
const escrow = await ethers.deployContract("OptimisticEscrow", [
  USDC,
  ARBITER_ADDR || deployer.address,
  FEE_BPS,
]);
await escrow.waitForDeployment();
const escrowAddr = await escrow.getAddress();
console.log(`   ✅ OptimisticEscrow: ${escrowAddr}`);

// 2. Deploy VotingDispute
console.log("📄 Deploying VotingDispute...");
const voting = await ethers.deployContract("VotingDispute", [
  escrowAddr,
  NEW_CREDENTIAL,
]);
await voting.waitForDeployment();
const votingAddr = await voting.getAddress();
console.log(`   ✅ VotingDispute: ${votingAddr}`);

// 3. Wire escrow -> credential
console.log("🔗 Wiring escrow → GiglyCredential...");
await (await escrow.setGiglyCredential(NEW_CREDENTIAL)).wait();
console.log("   ✅");

// 4. Wire credential -> escrow
console.log("🔗 Wiring GiglyCredential → escrow...");
const cred = await ethers.getContractAt("GiglyCredential", NEW_CREDENTIAL);
await (await cred.setOptimisticEscrow(escrowAddr)).wait();
console.log("   ✅");

// 5. Wire credential -> VotingDispute
console.log("🔗 Wiring GiglyCredential → VotingDispute (minter)...");
await (await cred.setVotingDisputeContract(votingAddr)).wait();
console.log("   ✅");

// 6. Set legacy credential on VotingDispute
console.log("🔗 Setting legacy credential on VotingDispute...");
await (await voting.setLegacyCredential(LEGACY_CRED)).wait();
console.log("   ✅");

// 7. Set VotingDispute as arbiter on escrow
console.log("🔗 Setting VotingDispute as arbiter on escrow...");
await (await escrow.setArbiter(votingAddr)).wait();
console.log("   ✅");

// 8. Auto-register the 3 jurors
console.log("\n👥 Registering 3 Jurors...");
for (const j of JURORS) {
  try {
    const tx = await voting.adminRegisterJuror(j);
    await tx.wait();
    console.log(`   ✅ Registered juror: ${j}`);
  } catch (err) {
    console.log(`   ⚠️  Error registering ${j}:`, (err as Error).message);
  }
}

const poolSize = await voting.jurorPoolSize();
console.log(`\n🎉 Juror pool confirmed size: ${poolSize}`);
const currentBlock = await ethers.provider.getBlockNumber();

// 9. Update deployed.json
const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf-8"));
fs.writeFileSync("deployed.json", JSON.stringify({
  ...deployed,
  OptimisticEscrow: escrowAddr,
  VotingDispute: votingAddr,
}, null, 2));

console.log("\n══════════════════════════════════════════════════");
console.log("  DEPLOYMENT SUCCESSFUL");
console.log("══════════════════════════════════════════════════");
console.log(`OptimisticEscrow : ${escrowAddr}`);
console.log(`VotingDispute    : ${votingAddr}`);
console.log(`BlockNumber      : ${currentBlock}`);
