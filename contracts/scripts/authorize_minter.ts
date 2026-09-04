import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!rpcUrl || !privateKey) throw new Error("Missing env vars");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const deployed = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  
  const credentialAddress = deployed.GiglyCredential;
  const escrowAddress = deployed.OptimisticEscrow;
  
  const abi = ["function setOptimisticEscrow(address _escrow) external"];
  const credential = new ethers.Contract(credentialAddress, abi, signer);
  
  console.log(`Setting Escrow authorized minter to ${escrowAddress} on Credential ${credentialAddress}...`);
  const tx = await credential.setOptimisticEscrow(escrowAddress);
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ Authorized Minter successfully updated!");
}

main().catch(console.error);
