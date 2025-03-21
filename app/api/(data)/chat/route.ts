import { NextResponse } from "next/server";
import { processChatRequest } from "@/services/chatService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await processChatRequest(body);
    return NextResponse.json({ response });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
