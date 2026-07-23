import { createPublicClient, http, parseAbiItem } from "viem";
import { sepolia } from "viem/chains";

async function main() {
  const client = createPublicClient({
    chain: sepolia,
    transport: http("https://gateway.tenderly.co/public/sepolia"),
  });

  const address = "0xa740A72E452e138DCc4dB613f8dbbc6eb42A681B";

  const jobCount = await client.readContract({
    address,
    abi: [{
      "inputs": [],
      "name": "jobCount",
      "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: "jobCount",
  });
  
  console.log("Total jobs:", jobCount);
  
  for (let i = 1n; i <= jobCount; i++) {
    const job = await client.readContract({
      address,
      abi: [{
        "inputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "name": "jobs",
        "outputs": [
          {"internalType": "address","name": "client","type": "address"},
          {"internalType": "address","name": "freelancer","type": "address"},
          {"internalType": "uint256","name": "amount","type": "uint256"},
          {"internalType": "uint256","name": "releasedAmount","type": "uint256"},
          {"internalType": "uint256","name": "submittedAt","type": "uint256"},
          {"internalType": "uint8","name": "status","type": "uint8"},
          {"internalType": "string","name": "taskTitle","type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
      }],
      functionName: "jobs",
      args: [i],
    });
    
    // @ts-ignore
    if (job[6].includes("Make a call bomber")) {
      console.log(`\nFound matching job! ID: ${i}`);
      
      const logs = await client.getLogs({
        address,
        event: parseAbiItem("event WorkSubmitted(uint256 indexed jobId, uint256 submittedAt, string submissionLink)"),
        args: {
          jobId: i
        },
        fromBlock: 6300000n,
        toBlock: "latest"
      });
      
      if (logs.length > 0) {
        console.log(`Raw submissionLink: "${logs[0].args.submissionLink}"`);
      } else {
        console.log(`No WorkSubmitted event found for Job ${i}`);
      }
    }
  }
}

main().catch(console.error);
