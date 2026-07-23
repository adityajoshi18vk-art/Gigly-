import { useEffect, useState } from "react";
import { getContractEvents, prepareEvent } from "thirdweb";
import { escrowContract, DEPLOYMENT_BLOCK } from "./config";

// The WorkSubmitted event signature
const workSubmittedEvent = prepareEvent({
  signature: "event WorkSubmitted(uint256 indexed jobId, uint256 submittedAt, string submissionLink)",
});

export function useSubmissionLinks(refreshCounter: number) {
  const [links, setLinks] = useState<Record<number, string>>({});

  useEffect(() => {
    async function fetchLinks() {
      try {
        const events = await getContractEvents({
          contract: escrowContract,
          events: [workSubmittedEvent],
          fromBlock: DEPLOYMENT_BLOCK,
        });

        const linkMapping: Record<number, string> = {};
        
        events.forEach((event) => {
          const jobId = Number(event.args.jobId);
          const submissionLink = event.args.submissionLink;
          if (submissionLink) {
            linkMapping[jobId] = submissionLink;
          }
        });

        setLinks(linkMapping);
      } catch (err) {
        console.error("Failed to fetch submission links:", err);
      }
    }

    fetchLinks();
  }, [refreshCounter]);

  return links;
}
