import "dotenv/config";
import * as fs from "fs";
import { network } from "hardhat";

const ESCROW_ADDR    = "0x80C53026081b2710b0e2705332790322DC7e7300";
const VOTING_DISPUTE = "0xbd808E4992Acf83d1Fd0454B6962c1f937a5dB1F";

const { ethers } = await network.create();
const escrow = await ethers.getContractAt("OptimisticEscrow", ESCROW_ADDR);

const currentArbiter = await escrow.arbiter();
console.log("Current arbiter on escrow:", currentArbiter);

if (currentArbiter.toLowerCase() !== VOTING_DISPUTE.toLowerCase()) {
  console.log("Setting VotingDispute as arbiter...");
  const tx = await escrow.setArbiter(VOTING_DISPUTE);
  await tx.wait();
  console.log("✅ Arbiter successfully set to:", VOTING_DISPUTE);
} else {
  console.log("✅ Arbiter is already set correctly!");
}

const voting = await ethers.getContractAt("VotingDispute", VOTING_DISPUTE);
console.log("VotingDispute.escrow:", await voting.escrow());
console.log("VotingDispute.credential:", await voting.credential());
console.log("VotingDispute.legacyCredential:", await voting.legacyCredential());

// Update deployed.json
const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf-8"));
fs.writeFileSync("deployed.json", JSON.stringify({
  ...deployed,
  OptimisticEscrow: ESCROW_ADDR,
  VotingDispute: VOTING_DISPUTE,
}, null, 2));
