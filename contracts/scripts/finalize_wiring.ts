import "dotenv/config";
import { network } from "hardhat";

const VOTING_DISPUTE   = "0xbaE78ef2777959fE419De8a28Ed1D974216279D2";
const NEW_CREDENTIAL   = "0x7CbC2961526453E48154Bc5A045bc254Eb61B46C";

const { ethers, networkName } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("══════════════════════════════════════════════════");
console.log("  🔗 Finalize VotingDispute wiring");
console.log(`  Network       : ${networkName}`);
console.log(`  Deployer      : ${deployer.address}`);
console.log(`  VotingDispute : ${VOTING_DISPUTE}`);
console.log(`  New Cred      : ${NEW_CREDENTIAL}`);
console.log("══════════════════════════════════════════════════\n");

const voting = await ethers.getContractAt("VotingDispute", VOTING_DISPUTE);

console.log("Updating VotingDispute → new GiglyCredential...");
const current = await voting.credential();
console.log("  Current credential:", current);

if (current.toLowerCase() === NEW_CREDENTIAL.toLowerCase()) {
  console.log("  ✅ Already set!");
} else {
  const tx = await voting.setCredential(NEW_CREDENTIAL);
  await tx.wait();
  console.log("  ✅ Done!");
}

const finalCred = await voting.credential();
const finalEscrow = await voting.escrow();
console.log("\nFinal state:");
console.log("  VotingDispute.escrow     :", finalEscrow);
console.log("  VotingDispute.credential :", finalCred);
console.log("\n✅ All done! System is fully wired.");
