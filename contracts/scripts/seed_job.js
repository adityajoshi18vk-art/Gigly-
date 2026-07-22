import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!rpcUrl || !privateKey) throw new Error("Missing env vars");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const usdcAddress = "0x1c55C94Bdb23F6d4dAE9Fac90ff01bf21b326952";
  const escrowAddress = "0xDbA2e8035EFBB64ab17509aFf7181Fe8DB9f9750";
  const freelancer = "0x750E278e1470e6a0db967BEeA91b82429C371944";
  
  const usdcAbi = ["function mint(address to, uint256 amount) public", "function approve(address spender, uint256 amount) public returns (bool)"];
  const escrowAbi = ["function createJob(address freelancer, uint256 amount, string taskTitle) public returns (uint256)"];
  
  const usdc = new ethers.Contract(usdcAddress, usdcAbi, signer);
  const escrow = new ethers.Contract(escrowAddress, escrowAbi, signer);

  console.log("Minting 100 USDC to deployer...");
  const amount = ethers.parseUnits("100", 6);
  let tx = await usdc.mint(signer.address, amount);
  await tx.wait();

  console.log("Approving escrow...");
  tx = await usdc.approve(escrowAddress, amount);
  await tx.wait();

  console.log("Creating job for freelancer:", freelancer);
  tx = await escrow.createJob(freelancer, amount, "Design landing page");
  const receipt = await tx.wait();
  
  console.log("Job created! TX Hash:", receipt.hash);
}

main().catch(console.error);
