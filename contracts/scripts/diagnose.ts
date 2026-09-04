import "dotenv/config";
import { network } from "hardhat";

const ESCROW         = "0x4B60d9531fCF480edc6cE7FAfF27A171e61bA672";
const OLD_CREDENTIAL = "0xFB43c1182F51583d33E2e191DB32025DE115ea75";
const NEW_CREDENTIAL = "0x7CbC2961526453E48154Bc5A045bc254Eb61B46C";
const VOTING_DISPUTE = "0xbaE78ef2777959fE419De8a28Ed1D974216279D2";

const { ethers } = await network.create();

const escrow     = await ethers.getContractAt("OptimisticEscrow", ESCROW);
const oldCred    = await ethers.getContractAt("GiglyCredential",  OLD_CREDENTIAL);
const newCred    = await ethers.getContractAt("GiglyCredential",  NEW_CREDENTIAL);

console.log("── Escrow ──────────────────────────────────────");
console.log("  address         :", ESCROW);
try { console.log("  giglyCredential :", await escrow.giglyCredential()); } catch { console.log("  giglyCredential : ❌ function missing on deployed contract!"); }
console.log("  arbiter         :", await escrow.arbiter());
console.log("  owner           :", await escrow.owner());

console.log("\n── Old Credential (0xFB43...) ──────────────────");
console.log("  optimisticEscrow     :", await oldCred.optimisticEscrow());
try { console.log("  votingDisputeContract:", await oldCred.votingDisputeContract()); } catch { console.log("  votingDisputeContract: ❌ function missing — old ABI"); }

console.log("\n── New Credential (0x7CbC...) ──────────────────");
console.log("  optimisticEscrow     :", await newCred.optimisticEscrow());
console.log("  votingDisputeContract:", await newCred.votingDisputeContract());

console.log("\n── VotingDispute ────────────────────────────────");
const vd = await ethers.getContractAt("VotingDispute", VOTING_DISPUTE);
console.log("  escrow     :", await vd.escrow());
console.log("  credential :", await vd.credential());
