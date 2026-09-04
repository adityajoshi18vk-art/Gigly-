import "dotenv/config";
import { network } from "hardhat";

const ESCROW_ADDR = "0xAD14d8b77b661997A92a32fCf45FA65B2E2Ae802";
const { ethers } = await network.create();
const escrow = await ethers.getContractAt("OptimisticEscrow", ESCROW_ADDR);

const count = await escrow.jobCount();
const rw = await escrow.reviewWindow();
console.log("New escrow address: ", ESCROW_ADDR);
console.log("Total jobs on new escrow:", count.toString());
console.log("reviewWindow:", rw.toString(), "seconds (", Number(rw)/3600, "hours )");

for (let i = 1; i <= Number(count); i++) {
  const job = await escrow.jobs(i);
  console.log(`Job #${i}:`, {
    client: job.client,
    freelancer: job.freelancer,
    status: job.status.toString(),
    submittedAt: job.submittedAt.toString(),
  });
}
