import "dotenv/config";
import hre from "hardhat";

import * as fs from "fs";

// Create a network connection (Hardhat 3 style)
const { ethers } = await hre.network.create();

async function main() {
  const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  const mockUsdcAddress = deployed.MockUSDC;
  const clientAddress = "0x899DDC8351A829C34a6896738b14bAfE12445713";
  const amountToMint = ethers.parseUnits("2000", 6);

  console.log(`Attaching to MockUSDC at ${mockUsdcAddress}...`);
  const mockUSDC = await ethers.getContractAt("MockUSDC", mockUsdcAddress);

  console.log(`Minting 2,000 Mock USDC to client wallet ${clientAddress}...`);
  const tx = await mockUSDC.mint(clientAddress, amountToMint);
  
  console.log(`Transaction sent (hash: ${tx.hash}). Waiting for confirmation...`);
  await tx.wait();
  
  const balance = await mockUSDC.balanceOf(clientAddress);
  console.log(`\n✅ Success! New Mock USDC balance for ${clientAddress} is ${ethers.formatUnits(balance, 6)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
