import { getContractEvents, prepareEvent, createThirdwebClient, getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";

async function main() {
  const client = createThirdwebClient({ clientId: "eecff2bf7f966088b55feeeeea5e2739" });
  const escrowContract = getContract({
    client,
    chain: sepolia,
    address: "0xc87EcE5cB40baFC7Eb542Bd805eC053E9b625DFE",
  });

  const disputeRaisedEvent = prepareEvent({
    signature: "event DisputeRaised(uint256 indexed jobId, address indexed raisedBy, string reason)",
  });
  
  const workSubmittedEvent = prepareEvent({
    signature: "event WorkSubmitted(uint256 indexed jobId, uint256 submittedAt, string submissionLink)",
  });
  
  const events2 = await getContractEvents({
    contract: escrowContract,
    events: [workSubmittedEvent],
    fromBlock: 1n,
  });
  
  console.log("WorkSubmitted:", events2.map(e => ({...e.args, block: e.blockNumber})));

  const events = await getContractEvents({
    contract: escrowContract,
    events: [disputeRaisedEvent],
    fromBlock: 1n,
  });
  
  console.log("DisputeRaised:", events.map(e => ({...e.args, block: e.blockNumber})));
}

main().catch(console.error);
