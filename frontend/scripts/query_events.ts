import { createThirdwebClient, getContract, prepareEvent, getContractEvents } from "thirdweb";
import { sepolia } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: "193237dc1efd5cce123307684db4a8bf", // This is the one used in the frontend config
});

const escrowContract = getContract({
  client,
  chain: sepolia,
  address: "0xa740A72E452e138DCc4dB613f8dbbc6eb42A681B",
});

const workSubmittedEvent = prepareEvent({
  signature: "event WorkSubmitted(uint256 indexed jobId, uint256 submittedAt, string submissionLink)",
});

async function main() {
  const events = await getContractEvents({
    contract: escrowContract,
    events: [workSubmittedEvent],
    fromBlock: 11200000n, // Close to current block
  });

  const targetJobId = 2n; // From previous script output
  const jobEvents = events.filter(e => e.args.jobId === targetJobId);
  
  if (jobEvents.length > 0) {
    console.log(`\nRaw submissionLink from WorkSubmitted event for Job 2:`);
    console.log(`"${jobEvents[0].args.submissionLink}"`);
  } else {
    console.log(`\nNo WorkSubmitted event found for Job 2.`);
  }
}

main().catch(console.error);
