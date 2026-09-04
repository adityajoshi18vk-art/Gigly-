import "dotenv/config";
import { network } from "hardhat";
const { ethers } = await network.create();
const block = await ethers.provider.getBlockNumber();
console.log("Current block:", block);
