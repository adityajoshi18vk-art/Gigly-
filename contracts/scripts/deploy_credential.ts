import * as fs from "fs";
import "dotenv/config";
import { network } from "hardhat";

async function main() {
  const { ethers, networkName } = await network.create();

  // Existing Escrow address from config.ts
  const ESCROW_ADDRESS = "0x4B60d9531fCF480edc6cE7FAfF27A171e61bA672";

  console.log("══════════════════════════════════════════════════");
  console.log("  🚀 Deploying ONLY GiglyCredential (SBT)");
  console.log(`  Network  : ${networkName}`);
  console.log(`  Escrow   : ${ESCROW_ADDRESS}`);
  console.log("══════════════════════════════════════════════════\n");

  // 1. Deploy GiglyCredential
  console.log("📄 Deploying GiglyCredential (SBT)...");
  const credential = await ethers.deployContract("GiglyCredential");
  await credential.waitForDeployment();
  const credentialAddress = await credential.getAddress();
  console.log(`   ✅ GiglyCredential deployed at: ${credentialAddress}\n`);

  // 2. Link them together
  console.log("🔗 Linking contracts...");
  
  // Set Escrow in Credential
  console.log("   -> Setting escrow in GiglyCredential...");
  const tx1 = await credential.setOptimisticEscrow(ESCROW_ADDRESS);
  await tx1.wait();

  // Set Credential in existing Escrow
  console.log("   -> Setting credential in OptimisticEscrow...");
  const escrow = await ethers.getContractAt("OptimisticEscrow", ESCROW_ADDRESS);
  const tx2 = await escrow.setGiglyCredential(credentialAddress);
  await tx2.wait();

  console.log(`   ✅ Linked successfully!\n`);

  console.log("══════════════════════════════════════════════════");
  console.log(`  GiglyCredential     : ${credentialAddress}`);
  console.log("══════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
