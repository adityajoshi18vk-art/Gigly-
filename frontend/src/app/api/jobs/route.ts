import { NextResponse } from "next/server";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { CONTRACTS } from "@/lib/config";

export const dynamic = "force-dynamic"; // Never cache at Next.js layer either

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "fe0bc6654c8336f5d5d7d0ed871a7eea",
});

const escrowContract = getContract({
  client,
  chain: sepolia,
  address: CONTRACTS.OptimisticEscrow,
});

export async function GET() {
  try {
    const rawCount = await readContract({
      contract: escrowContract,
      method: "function jobCount() view returns (uint256)",
      params: [],
    });
    const count = Number(rawCount);

    if (count === 0) {
      return NextResponse.json({ jobs: [] });
    }

    const jobIds = Array.from({ length: count }, (_, i) => BigInt(i + 1));
    const allJobs = await Promise.all(
      jobIds.map(async (id) => {
        try {
          const data = await readContract({
            contract: escrowContract,
            method: "function jobs(uint256) view returns (address, address, uint256, uint256, uint256, uint8, string, string)",
            params: [id],
          });
          return {
            id: Number(id),
            client: data[0],
            freelancer: data[1],
            amount: data[2].toString(),
            releasedAmount: data[3].toString(),
            submittedAt: data[4].toString(),
            status: Number(data[5]),
            taskTitle: data[6] || `Job #${id}`,
            submissionLink: data[7] || "",
          };
        } catch (err) {
          console.warn(`Error reading job #${id}:`, err);
          return null;
        }
      })
    );

    const validJobs = allJobs.filter((j) => j !== null);
    return NextResponse.json({ jobs: validJobs });
  } catch (err: any) {
    console.error("Failed to fetch jobs in API route:", err);
    return NextResponse.json({ jobs: [], error: err?.message || "Failed to fetch jobs" }, { status: 500 });
  }
}
