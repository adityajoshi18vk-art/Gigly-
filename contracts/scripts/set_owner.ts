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

  const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  const escrowAddress = deployed.OptimisticEscrow;
  
  const abi = ["function transferOwnership(address newOwner) external"];
  const escrow = new ethers.Contract(escrowAddress, abi, signer);
  
  const newOwner = process.env.NEW_OWNER;
  if (!newOwner) {
    console.error("❌ Please provide the new owner address by setting NEW_OWNER.");
    process.exit(1);
  }
  
  console.log(`Setting owner to ${newOwner} on contract ${escrowAddress}...`);
  const tx = await escrow.transferOwnership(newOwner);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("✅ Owner successfully updated!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
