import hre from "hardhat";

async function main() {
  const usdcAddress = "0xa648Aa11f01b634524D3EbceC0fCb950B7669142";
  const targetAddress = "0x43b94317B8493c954B566F2D15274083b4F90fE5"; // The calculated v0.6 smart account address
  
  const [signer] = await hre.ethers.getSigners();
  console.log("Using signer:", signer.address);

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUsdc = MockUSDC.attach(usdcAddress);

  console.log(`Minting 2000 USDC to ${targetAddress}...`);
  const amount = hre.ethers.parseUnits("2000", 6);
  const tx = await mockUsdc.mint(targetAddress, amount);
  await tx.wait();
  
  const balance = await mockUsdc.balanceOf(targetAddress);
  console.log(`Minted! New balance: ${hre.ethers.formatUnits(balance, 6)} USDC`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
