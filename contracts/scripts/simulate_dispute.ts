import "dotenv/config";
import { network } from "hardhat";

const VOTING_DISPUTE = "0xbd808E4992Acf83d1Fd0454B6962c1f937a5dB1F";
const CLIENT_ADDR    = "0x612F53CEf7548f44dF9764F72ca84800C1082247";

const { ethers } = await network.create();
const voting = await ethers.getContractAt("VotingDispute", VOTING_DISPUTE);

console.log("Simulating raiseVotingDispute for Job #1 as client", CLIENT_ADDR);
try {
  await voting.raiseVotingDispute.staticCall(1, "Job deliverables do not match requirement specification", {
    from: CLIENT_ADDR,
  });
  console.log("✅ staticCall SUCCEEDED! The client transaction will go through without reverting!");
} catch (err) {
  console.error("❌ Simulation failed:", err);
}
