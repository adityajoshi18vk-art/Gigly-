import { NextResponse } from "next/server";
import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { CONTRACTS } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Create a fresh client+contract per request to avoid thirdweb's internal RPC cache
    const freshClient = createThirdwebClient({
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "fe0bc6654c8336f5d5d7d0ed871a7eea",
    });

    const freshEscrow = getContract({
      client: freshClient,
      chain: sepolia,
      address: CONTRACTS.OptimisticEscrow,
    });

    const rawCount = await readContract({
      contract: freshEscrow,
      method: "function jobCount() view returns (uint256)",
      params: [],
    });
    const count = Number(rawCount);

    if (count === 0) {
      return NextResponse.json({ jobs: [], count: 0 });
    }

    const jobIds = Array.from({ length: count }, (_, i) => BigInt(i + 1));
    const allJobs = await Promise.all(
      jobIds.map(async (id) => {
        try {
          const data = await readContract({
            contract: freshEscrow,
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
    return new NextResponse(JSON.stringify({ jobs: validJobs, count }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch jobs in API route:", err);
    return NextResponse.json({ jobs: [], error: err?.message || "Failed to fetch jobs" }, { status: 500 });
  }
}
