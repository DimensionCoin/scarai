import { hasEnoughCredits, deductCredits } from "@/actions/user.actions";
import { NextResponse } from "next/server";

export async function useValidation(userId: string, message: string) {
  if (!userId || !message) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!(await hasEnoughCredits(userId, 2))) {
    return NextResponse.json(
      { error: "Insufficient credits" },
      { status: 403 }
    );
  }
  return null;
}
