import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
  const abi = [
    "event WorkSubmitted(uint256 indexed jobId, uint256 submittedAt, string submissionLink)",
    "function jobCount() view returns (uint256)",
    "function jobs(uint256) view returns (address client, address freelancer, uint256 amount, uint256 releasedAmount, uint256 submittedAt, uint8 status, string taskTitle)"
  ];
  
  const escrow = new ethers.Contract("0xa740A72E452e138DCc4dB613f8dbbc6eb42A681B", abi, provider);
  const jobCount = await escrow.jobCount();
  console.log("Total jobs:", jobCount);
  
  for (let i = 1; i <= jobCount; i++) {
    const job = await escrow.jobs(i);
    if (job.taskTitle.includes("Make a call bomber")) {
      console.log(`\nFound matching job! ID: ${i}`);
      const filter = escrow.filters.WorkSubmitted(i);
      const events = await escrow.queryFilter(filter, 6300000, "latest");
      if (events.length > 0) {
        // @ts-ignore
        console.log(`Raw submissionLink: "${events[0].args[2]}"`);
      } else {
        console.log(`No WorkSubmitted event found for Job ${i}`);
      }
    }
  }
}

main().catch(console.error);
