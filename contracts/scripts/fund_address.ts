import "dotenv/config";
import hre from "hardhat";
import * as fs from "fs";

const { ethers } = await hre.network.create();

async function main() {
  const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  const mockUsdcAddress = deployed.MockUSDC;
  
  const targetAddress = process.env.FUND_ADDRESS;
  if (!targetAddress) {
    console.error("Please provide an address via FUND_ADDRESS env variable");
    process.exit(1);
  }

  const amountToMint = ethers.parseUnits("2000", 6);

  console.log(`Attaching to MockUSDC at ${mockUsdcAddress}...`);
  const mockUSDC = await ethers.getContractAt("MockUSDC", mockUsdcAddress);

  console.log(`Minting 2,000 Mock USDC to wallet ${targetAddress}...`);
  const tx = await mockUSDC.mint(targetAddress, amountToMint);
  
  console.log(`Transaction sent (hash: ${tx.hash}). Waiting for confirmation...`);
  await tx.wait();
  
  const balance = await mockUSDC.balanceOf(targetAddress);
  console.log(`\n✅ Success! New Mock USDC balance for ${targetAddress} is ${ethers.formatUnits(balance, 6)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
