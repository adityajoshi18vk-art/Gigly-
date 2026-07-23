import { useEffect, useState } from "react";
import { getContractEvents, prepareEvent } from "thirdweb";
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
        const events = await getContractEvents({
          contract: escrowContract,
          events: [disputeRaisedEvent],
          fromBlock: DEPLOYMENT_BLOCK,
        });

        const reasonMapping: Record<number, string> = {};
        
        events.forEach((event) => {
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
