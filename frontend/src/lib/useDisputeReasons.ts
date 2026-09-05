import { useEffect, useState } from "react";
import { getContractEvents, prepareEvent } from "thirdweb";
import { eth_blockNumber } from "thirdweb/rpc";
import { getRpcClient } from "thirdweb/rpc";
import { escrowContract, DEPLOYMENT_BLOCK } from "./config";

// The DisputeRaised event signature
const disputeRaisedEvent = prepareEvent({
  signature: "event DisputeRaised(uint256 indexed jobId, address indexed raisedBy, string reason)",
});

export function useDisputeReasons(refreshCounter: number) {
  const [reasons, setReasons] = useState<Record<number, string>>({});

  useEffect(() => {
    async function fetchReasons() {
      try {
        const rpcRequest = getRpcClient({ client: escrowContract.client, chain: escrowContract.chain });
        const currentBlockHex = await eth_blockNumber(rpcRequest);
        const currentBlock = BigInt(currentBlockHex);

        let fromBlock = DEPLOYMENT_BLOCK;
        const CHUNK_SIZE = BigInt(999);
        const allEvents = [];

        while (fromBlock <= currentBlock) {
          const toBlock = fromBlock + CHUNK_SIZE > currentBlock ? currentBlock : fromBlock + CHUNK_SIZE;
          
          const eventsChunk = await getContractEvents({
            contract: escrowContract,
            events: [disputeRaisedEvent],
            fromBlock,
            toBlock,
          });
          
          allEvents.push(...eventsChunk);
          fromBlock = toBlock + BigInt(1);
        }

        const reasonMapping: Record<number, string> = {};
        
        allEvents.forEach((event) => {
          const jobId = Number(event.args.jobId);
          const reason = event.args.reason;
          if (reason) {
            reasonMapping[jobId] = reason;
          }
        });

        setReasons(reasonMapping);
      } catch (err) {
        console.error("Failed to fetch dispute reasons:", err);
      }
    }

    fetchReasons();
  }, [refreshCounter]);

  return reasons;
}
