import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/db";
import User from "@/models/user.model";

export const runtime = "nodejs"; // Required for Mongo + Vercel Cron

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.CRON_SECRET_KEY;

  // 🔐 Auth Check
  if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
    console.warn("❌ Unauthorized cron job attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("✅ Authorized cron request — connecting to DB...");
    await connect();

    // 🧼 Reset credits for free tier
    const result = await User.updateMany(
      { subscriptionTier: "free" },
      { $set: { credits: 20 } }
    );

    console.log(`🔁 ${result.modifiedCount} users reset to 20 credits`);
    return NextResponse.json(
      {
        message: "Monthly credit reset successful",
        usersUpdated: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Cron job failed:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
