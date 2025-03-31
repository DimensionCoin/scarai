import { NextResponse } from "next/server";
import { connect } from "@/db";
import User from "@/models/user.model";

export const runtime = "nodejs"; // Needed for Mongo

export async function GET() {
  try {
    await connect();

    const result = await User.updateMany(
      { subscriptionTier: "free" },
      { $set: { credits: 20 } }
    );

    console.log(`✅ Reset credits for ${result.modifiedCount} free users`);

    return NextResponse.json({
      message: "Monthly credit reset successful",
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error("❌ Cron job failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
