import "dotenv/config";
import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.create();
  const escrow = await ethers.getContractAt("OptimisticEscrow", "0xa740A72E452e138DCc4dB613f8dbbc6eb42A681B");
  
  const currentBlock = await ethers.provider.getBlockNumber();
  const fromBlock = currentBlock - 50000;
  console.log(`Querying from block ${fromBlock} to current (${currentBlock})...`);

  const jobCount = await escrow.jobCount();
  console.log(`Total jobs: ${jobCount}`);
  
  for (let i = 1; i <= jobCount; i++) {
    const job = await escrow.jobs(i);
    if (job.taskTitle.includes("Make a call bomber")) {
      console.log(`\nFound matching job! ID: ${i}`);
      console.log(`Task Title: ${job.taskTitle}`);
      
      const filter = escrow.filters.WorkSubmitted(i);
      const events = await escrow.queryFilter(filter, fromBlock);
      
      if (events.length > 0) {
        console.log(`\nRaw submissionLink from WorkSubmitted event for Job ${i}:`);
        console.log(`"${events[0].args[2]}"`);
      } else {
        console.log(`\nNo WorkSubmitted event found for Job ${i}.`);
      }
    }
  }
}

main().catch(console.error);
