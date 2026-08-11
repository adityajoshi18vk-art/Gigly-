import { useEffect, useState } from "react";
import { getContractEvents, watchContractEvents, prepareEvent } from "thirdweb";
import { escrowContract, DEPLOYMENT_BLOCK } from "./config";

// The ProgressLogged event signature
const progressLoggedEvent = prepareEvent({
  signature: "event ProgressLogged(uint256 indexed jobId, uint8 percent, string note)",
});

export interface ProgressUpdate {
  percent: number;
  note: string;
  timestamp: number;
}

export function useProgressUpdates(refreshCounter?: number) {
  const [updates, setUpdates] = useState<Record<number, ProgressUpdate>>({});

  useEffect(() => {
    let unwatch: (() => void) | undefined;
    let pollInterval: ReturnType<typeof setInterval>;

    async function fetchHistoricalEvents() {
      try {
        console.log("[ProgressUpdates] Fetching events from block", DEPLOYMENT_BLOCK.toString());
        const events = await getContractEvents({
          contract: escrowContract,
          events: [progressLoggedEvent],
          fromBlock: DEPLOYMENT_BLOCK,
        });

        console.log("[ProgressUpdates] Found", events.length, "events");

        const updateMapping: Record<number, ProgressUpdate> = {};
        
        events.forEach((event) => {
          const jobId = Number(event.args.jobId);
          const percent = event.args.percent;
          const note = event.args.note;
          // @ts-expect-error - blockTimestamp exists on event but types are incomplete
          const timestamp = event.blockTimestamp ? Number(event.blockTimestamp) : Math.floor(Date.now() / 1000);
          
          console.log("[ProgressUpdates] Event: jobId=", jobId, "percent=", percent, "note=", note);
          
          if (!updateMapping[jobId] || updateMapping[jobId].timestamp <= timestamp) {
            updateMapping[jobId] = { percent, note, timestamp };
          }
        });

        setUpdates((prev) => ({ ...prev, ...updateMapping }));
      } catch (err) {
        console.error("[ProgressUpdates] Failed to fetch historical progress events:", err);
      }
    }

    async function setupProgressTracking() {
      await fetchHistoricalEvents();

      try {
        unwatch = watchContractEvents({
          contract: escrowContract,
          events: [progressLoggedEvent],
          onEvents: (newEvents) => {
            console.log("[ProgressUpdates] watchContractEvents fired with", newEvents.length, "events");
            setUpdates((prev) => {
              const next = { ...prev };
              newEvents.forEach((event) => {
                const jobId = Number(event.args.jobId);
                const percent = event.args.percent;
                const note = event.args.note;
                // @ts-expect-error - blockTimestamp exists on event but types are incomplete
                const timestamp = event.blockTimestamp ? Number(event.blockTimestamp) : Math.floor(Date.now() / 1000);
                
                if (!next[jobId] || next[jobId].timestamp <= timestamp) {
                  next[jobId] = { percent, note, timestamp };
                }
              });
              return next;
            });
          },
        });
      } catch (err) {
        console.error("[ProgressUpdates] Failed to setup watchContractEvents:", err);
      }
      
      pollInterval = setInterval(fetchHistoricalEvents, 10000);
    }

    setupProgressTracking();

    return () => {
      if (unwatch) {
        unwatch();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [refreshCounter]);

  return updates;
}
