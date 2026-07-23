import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const rpcUrl = "https://sepolia.rpc.thirdweb.com";

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const escrowAddress = "0xc87EcE5cB40baFC7Eb542Bd805eC053E9b625DFE";
  const abi = [
    "event WorkSubmitted(uint256 indexed jobId, uint256 submittedAt, string submissionLink)",
    "event DisputeRaised(uint256 indexed jobId, address indexed raisedBy, string reason)"
  ];
  
  const escrow = new ethers.Contract(escrowAddress, abi, provider);

  const currentBlock = await provider.getBlockNumber();
  console.log("Current block:", currentBlock);
  const fromBlock = currentBlock - 5000;

  console.log("Querying WorkSubmitted events...");
  const workEvents = await escrow.queryFilter(escrow.filters.WorkSubmitted(1), fromBlock, "latest");
  console.log("WorkSubmitted events found:", workEvents.length);
  for (const ev of workEvents) {
    console.log(`- JobId: ${ev.args[0]}, SubmittedAt: ${ev.args[1]}, Link: ${ev.args[2]}`);
  }

  console.log("\nQuerying DisputeRaised events...");
  const disputeEvents = await escrow.queryFilter(escrow.filters.DisputeRaised(1), fromBlock, "latest");
  console.log("DisputeRaised events found:", disputeEvents.length);
  for (const ev of disputeEvents) {
    console.log(`- JobId: ${ev.args[0]}, RaisedBy: ${ev.args[1]}, Reason: ${ev.args[2]}`);
  }
}

main().catch(console.error);
