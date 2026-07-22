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
  const targetAddress = "0x99424dfd6F29e3754228Bd40405bfD1439bcEC4F"; // Actual smart account from frontend
  
  const abi = ["function mint(address to, uint256 amount) public", "function balanceOf(address account) public view returns (uint256)"];
  const mockUsdc = new ethers.Contract(usdcAddress, abi, signer);

  console.log(`Minting 2000 USDC to ${targetAddress}...`);
  const amount = ethers.parseUnits("2000", 6);
  const tx = await mockUsdc.mint(targetAddress, amount);
  await tx.wait();
  
  const balance = await mockUsdc.balanceOf(targetAddress);
  console.log(`Minted! New balance: ${ethers.formatUnits(balance, 6)} USDC`);
}

main().catch(console.error);
