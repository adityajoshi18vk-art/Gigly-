import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!rpcUrl || !privateKey) throw new Error("Missing env vars (SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY)");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  console.log("Deployer:", signer.address);

  // Read existing deployed.json
  const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  const usdcAddress = deployed.USDC;
  const credentialAddress = deployed.GiglyCredential;

  // Get arbiter from env or existing
  const arbiterAddress = process.env.ARBITER_ADDRESS || deployed.Arbiter;
  const feeBps = process.env.FEE_BPS ? Number(process.env.FEE_BPS) : 250;

  if (!arbiterAddress) throw new Error("ARBITER_ADDRESS not set");

  // Compile artifacts path
  const escrowArtifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/OptimisticEscrow.sol/OptimisticEscrow.json", "utf8")
  );

  // Deploy OptimisticEscrow
  console.log(`Deploying OptimisticEscrow(USDC=${usdcAddress}, arbiter=${arbiterAddress}, feeBps=${feeBps})...`);
  const EscrowFactory = new ethers.ContractFactory(escrowArtifact.abi, escrowArtifact.bytecode, signer);
  const escrow = await EscrowFactory.deploy(usdcAddress, arbiterAddress, feeBps);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("OptimisticEscrow deployed:", escrowAddress);

  // Wire GiglyCredential
  if (credentialAddress && credentialAddress !== "0x0000000000000000000000000000000000000000") {
    console.log(`Setting GiglyCredential to ${credentialAddress}...`);
    const tx = await escrow.setGiglyCredential(credentialAddress);
    await tx.wait();
    console.log("GiglyCredential wired.");
  }

  // Set Treasury Wallet if provided
  const treasuryWallet = process.env.TREASURY_WALLET;
  if (treasuryWallet && treasuryWallet !== "0x0000000000000000000000000000000000000000") {
    console.log(`Setting TreasuryWallet to ${treasuryWallet}...`);
    const tx = await escrow.setTreasuryWallet(treasuryWallet);
    await tx.wait();
    console.log("TreasuryWallet wired.");
  }

  // Update deployed.json
  deployed.OptimisticEscrow = escrowAddress;
  fs.writeFileSync("deployed.json", JSON.stringify(deployed, null, 2));
  console.log("deployed.json updated.");

  console.log("\n--- IMPORTANT ---");
  console.log(`Update frontend/src/lib/config.ts: OptimisticEscrow = "${escrowAddress}"`);
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
