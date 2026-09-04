import "dotenv/config";
import { network } from "hardhat";

const VOTING_DISPUTE = "0xbd808E4992Acf83d1Fd0454B6962c1f937a5dB1F";
const ESCROW         = "0x80C53026081b2710b0e2705332790322DC7e7300";

const JURORS = [
  "0x107333eEb914b1f11a0fD4541c2E14A55304Df8C",
  "0x47A073f356aF6dC0c5DfAFC88704A4C09551f664",
  "0x0F398204A9D9DDEa7d1b353fBb0b17C89d37D1eA",
];

const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("Deployer:", deployer.address);
const voting = await ethers.getContractAt("VotingDispute", VOTING_DISPUTE);
const escrow = await ethers.getContractAt("OptimisticEscrow", ESCROW);

console.log("\n── Juror Pool Status ───────────────────────────────");
const poolSize = await voting.jurorPoolSize();
console.log("Current pool size:", poolSize.toString());

for (const j of JURORS) {
  const isJ = await voting.isJuror(j);
  console.log(`Juror ${j} isJuror:`, isJ);
  if (!isJ) {
    console.log(`Registering ${j} via adminRegisterJuror...`);
    const tx = await voting.adminRegisterJuror(j);
    await tx.wait();
    console.log(`  ✅ Registered ${j}`);
  }
}

const newPoolSize = await voting.jurorPoolSize();
console.log("\nNew pool size:", newPoolSize.toString());
const allJurors = await voting.getJurorPool();
console.log("All registered jurors:", allJurors);

console.log("\n── Escrow Jobs Status ─────────────────────────────");
const jobCount = await escrow.jobCount();
console.log("Total escrow jobs:", jobCount.toString());
for (let i = 1; i <= Number(jobCount); i++) {
  const job = await escrow.jobs(i);
  console.log(`Job #${i}:`, {
    client: job.client,
    freelancer: job.freelancer,
    amount: job.amount.toString(),
    submittedAt: job.submittedAt.toString(),
    status: job.status, // 0=None, 1=Funded, 2=Submitted, 3=Disputed, 4=Released, 5=Refunded
    taskTitle: job.taskTitle
  });
}
