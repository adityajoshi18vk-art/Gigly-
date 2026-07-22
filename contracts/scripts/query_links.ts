import "dotenv/config";
import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.create();
  const escrow = await ethers.getContractAt("OptimisticEscrow", "0xa740A72E452e138DCc4dB613f8dbbc6eb42A681B");
  const filter = escrow.filters.WorkSubmitted();
  const events = await escrow.queryFilter(filter, 6000000);
  console.log(events.map(e => ({jobId: e.args[0].toString(), link: e.args[2]})));
}

main().catch(console.error);
