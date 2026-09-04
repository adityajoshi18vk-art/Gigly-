import "dotenv/config";
import { network } from "hardhat";

const ESCROW_ADDR    = "0x80C53026081b2710b0e2705332790322DC7e7300";
const VOTING_DISPUTE = "0xbd808E4992Acf83d1Fd0454B6962c1f937a5dB1F";

const { ethers } = await network.create();
const escrow = await ethers.getContractAt("OptimisticEscrow", ESCROW_ADDR);
const voting = await ethers.getContractAt("VotingDispute", VOTING_DISPUTE);

const block = await ethers.provider.getBlock("latest");
const job1 = await escrow.jobs(1);
const reviewWindow = await escrow.REVIEW_WINDOW();

console.log("Current block timestamp:", block?.timestamp);
console.log("Job 1 submittedAt:      ", job1.submittedAt.toString());
console.log("Review window:           ", reviewWindow.toString(), "seconds");

const elapsed = BigInt(block!.timestamp) - job1.submittedAt;
console.log("Elapsed:                 ", elapsed.toString(), "seconds");

if (elapsed >= reviewWindow) {
  console.log(">>> CONFIRMED: Job 1 review window expired! That is why raiseVotingDispute reverted with ReviewWindowExpired()!");
}
