import { processChatRequestStream } from "@/services/chatService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await processChatRequestStream(body);

    // ✅ Return stream directly instead of wrapping it in NextResponse.json
    return response;
  } catch (error) {
    console.error("API Error:", error);
    return new Response("⚠️ Chat failed", { status: 500 });
  }
}
