import "dotenv/config";
import { network } from "hardhat";

const VOTING_DISPUTE = "0xbd808E4992Acf83d1Fd0454B6962c1f937a5dB1F";
const CLIENT_ADDR    = "0x612F53CEf7548f44dF9764F72ca84800C1082247";

const { ethers } = await network.create();
const voting = await ethers.getContractAt("VotingDispute", VOTING_DISPUTE);
const iface = voting.interface;
const data = iface.encodeFunctionData("raiseVotingDispute", [1, "Job deliverables do not match requirement specification"]);

try {
  const res = await ethers.provider.call({
    to: VOTING_DISPUTE,
    from: CLIENT_ADDR,
    data: data,
  });
  console.log("✅ eth_call SUCCEEDED! Result:", res);
} catch (err) {
  console.error("❌ eth_call failed:", err);
}
