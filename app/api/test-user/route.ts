// /pages/api/test-user.ts
"use server";

import User from "@/models/user.model";
import { connect } from "@/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connect();
    const userData = {
      clerkId: "test_" + Date.now(),
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      subscriptionTier: "free",
      customerId: "",
      credits: 20,
    };
    console.log("🔍 Test user data:", JSON.stringify(userData, null, 2));
    const newUser = await User.create(userData);
    console.log("🔍 Test user created:", JSON.stringify(newUser, null, 2));
    return NextResponse.json(newUser);
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
