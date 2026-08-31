import { NextResponse } from "next/server";
import { ZKPassport } from "@zkpassport/sdk";

export async function GET() {
  try {
    const zkPassport = new ZKPassport("localhost");

    const queryBuilder = await zkPassport.request({
      name: "FinGuard Escrow",
      purpose: "Prove valid identity for GDPR-compliant gig withdrawals",
    });

    const { url } = queryBuilder.done();

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[ZKPassport] Failed to generate verification request:", error);
    return NextResponse.json(
      { error: "Failed to generate ZKPassport verification URL" },
      { status: 500 }
    );
  }
}
