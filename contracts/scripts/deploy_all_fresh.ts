// deploy_all_fresh.ts
// Redeploys OptimisticEscrow + VotingDispute (fresh) and wires everything.
// Registers existing jurors passed in JUROR_1/2/3 env vars.
import "dotenv/config";
import * as fs from "fs";
import { network } from "hardhat";

const USDC            = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const NEW_CREDENTIAL  = "0x7CbC2961526453E48154Bc5A045bc254Eb61B46C";
const LEGACY_CRED     = "0xFB43c1182F51583d33E2e191DB32025DE115ea75";
const ARBITER_ADDR    = process.env.ARBITER_ADDRESS || "";
const FEE_BPS         = Number(process.env.FEE_BPS ?? 250);

// Existing jurors to auto-register (set via env or hardcode here)
const JURORS: string[] = [
  process.env.JUROR_1 || "",
  process.env.JUROR_2 || "",
  process.env.JUROR_3 || "",
].filter(Boolean);

const { ethers, networkName } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("══════════════════════════════════════════════════");
console.log("  🚀 Gigly — Full Fresh Deployment");
console.log(`  Network     : ${networkName}`);
console.log(`  Deployer    : ${deployer.address}`);
console.log(`  USDC        : ${USDC}`);
console.log(`  Credential  : ${NEW_CREDENTIAL}`);
console.log(`  Legacy Cred : ${LEGACY_CRED}`);
console.log(`  Human Arb   : ${ARBITER_ADDR}`);
console.log(`  Auto-jurors : ${JURORS.length ? JURORS.join(", ") : "none"}`);
console.log("══════════════════════════════════════════════════\n");

// ── 1. Deploy new OptimisticEscrow ───────────────────────────────────────
console.log("📄 Deploying OptimisticEscrow...");
const escrow = await ethers.deployContract("OptimisticEscrow", [
  USDC,
  ARBITER_ADDR || deployer.address, // fallback to deployer if no arbiter
  FEE_BPS,
]);
await escrow.waitForDeployment();
const escrowAddr = await escrow.getAddress();
console.log(`   ✅ OptimisticEscrow: ${escrowAddr}\n`);

// ── 2. Deploy new VotingDispute ──────────────────────────────────────────
console.log("📄 Deploying VotingDispute...");
const voting = await ethers.deployContract("VotingDispute", [
  escrowAddr,
  NEW_CREDENTIAL,
]);
await voting.waitForDeployment();
const votingAddr = await voting.getAddress();
console.log(`   ✅ VotingDispute: ${votingAddr}\n`);

// ── 3. Wire: escrow → credential ────────────────────────────────────────
console.log("🔗 Wiring escrow → GiglyCredential...");
await (await escrow.setGiglyCredential(NEW_CREDENTIAL)).wait();
console.log("   ✅");

// ── 4. Wire: credential → escrow (setOptimisticEscrow) ──────────────────
console.log("🔗 Wiring GiglyCredential → new escrow...");
const cred = await ethers.getContractAt("GiglyCredential", NEW_CREDENTIAL);
await (await cred.setOptimisticEscrow(escrowAddr)).wait();
console.log("   ✅");

// ── 5. Wire: credential → VotingDispute (setVotingDisputeContract) ───────
console.log("🔗 Wiring GiglyCredential → VotingDispute (minter)...");
await (await cred.setVotingDisputeContract(votingAddr)).wait();
console.log("   ✅");

// ── 6. Wire: VotingDispute → legacy credential (eligibility only) ────────
console.log("🔗 Setting legacy credential on VotingDispute...");
await (await voting.setLegacyCredential(LEGACY_CRED)).wait();
console.log("   ✅");

// ── 7. Wire: set VotingDispute as arbiter on escrow ──────────────────────
console.log("🔗 Setting VotingDispute as arbiter on escrow...");
await (await escrow.setArbiter(votingAddr)).wait();
console.log("   ✅");

// ── 8. Auto-register jurors ──────────────────────────────────────────────
if (JURORS.length > 0) {
  console.log(`\n👥 Registering ${JURORS.length} juror(s)...`);
  for (const juror of JURORS) {
    try {
      await (await voting.adminRegisterJuror(juror)).wait();
      console.log(`   ✅ Registered: ${juror}`);
    } catch (e) {
      console.log(`   ⚠️  Failed for ${juror}:`, (e as Error).message);
    }
  }
}

// ── 9. Save deployed.json ─────────────────────────────────────────────────
const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf-8"));
fs.writeFileSync("deployed.json", JSON.stringify({
  ...deployed,
  OptimisticEscrow: escrowAddr,
  GiglyCredential: NEW_CREDENTIAL,
  VotingDispute: votingAddr,
}, null, 2));

console.log("\n══════════════════════════════════════════════════");
console.log("  ✅ Deployment Complete!");
console.log("──────────────────────────────────────────────────");
console.log(`  OptimisticEscrow : ${escrowAddr}`);
console.log(`  VotingDispute    : ${votingAddr}`);
console.log(`  GiglyCredential  : ${NEW_CREDENTIAL}`);
console.log("══════════════════════════════════════════════════");
console.log("\n💡 Update frontend/src/lib/config.ts:");
console.log(`   OptimisticEscrow: "${escrowAddr}",`);
console.log(`   VotingDispute:    "${votingAddr}",`);
