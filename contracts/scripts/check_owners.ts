import "dotenv/config";
import { network } from "hardhat";

const ESCROW     = "0x4B60d9531fCF480edc6cE7FAfF27A171e61bA672";
const CREDENTIAL = "0xFB43c1182F51583d33E2e191DB32025DE115ea75";

const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();

const escrow     = await ethers.getContractAt("OptimisticEscrow", ESCROW);
const credential = await ethers.getContractAt("GiglyCredential", CREDENTIAL);

console.log("Deployer (.env key) :", deployer.address);
console.log("Escrow owner        :", await escrow.owner());
console.log("Credential owner    :", await credential.owner());
console.log("Escrow arbiter      :", await escrow.arbiter());
