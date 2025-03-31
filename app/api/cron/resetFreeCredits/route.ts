import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/db";
import User from "@/models/user.model";

export const runtime = "node"; // Required for Vercel Cron

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.CRON_SECRET_KEY;

  if (authHeader !== `Bearer ${expectedKey}`) {
    console.warn("🔐 Unauthorized attempt to trigger resetFreeCredits");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();

    const result = await User.updateMany(
      { subscriptionTier: "free" },
      { $set: { credits: 20 } }
    );

    console.log(
      `✅ Monthly credit reset: ${result.modifiedCount} free users updated`
    );
    return NextResponse.json(
      { message: "Credits reset", modified: result.modifiedCount },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Failed to reset credits:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
