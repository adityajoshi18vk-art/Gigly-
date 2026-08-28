// scripts/deploy_inr_feed.ts
// Deploys MockINRFeed to Sepolia with a realistic INR/USD rate.
// Usage: npx hardhat run scripts/deploy_inr_feed.ts --network sepolia

import "dotenv/config";
import { network } from "hardhat";

const { ethers } = await network.create();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockINRFeed with account:", deployer.address);

  // ~95.45 INR/USD with 8 decimals = 9_545_000_000
  const initialAnswer = 9_545_000_000n;

  const MockINRFeed = await ethers.getContractFactory("MockINRFeed");
  const feed = await MockINRFeed.deploy(initialAnswer);
  await feed.waitForDeployment();

  const address = await feed.getAddress();
  console.log("✅ MockINRFeed deployed to:", address);

  // Verify the stored rate
  const roundData = await feed.latestRoundData();
  const storedRate = Number(roundData[1]) / 1e8;
  console.log(`   INR/USD rate: ${storedRate}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
