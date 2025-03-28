import { NextRequest } from "next/server";
import { processScarMessage } from "@/services/scarAiService";
import { ChatMessage } from "@/types/chat";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const {
    message,
    chatHistory,
  }: { message: string; chatHistory: ChatMessage[] } = await req.json();

  if (!message || !chatHistory?.length) {
    return new Response("No messages provided", { status: 400 });
  }

  const { userId } = await auth(); // ✅ await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await processScarMessage({
      userId,
      message,
      chatHistory,
    });

    // ✅ Type guard: check if it's a NextResponse (error case)
    if (result instanceof Response) {
      return result;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < result.response.length; i += 5) {
          const chunk = result.response.slice(i, i + 5);
          controller.enqueue(encoder.encode(chunk));
          await new Promise((res) => setTimeout(res, 10));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("❌ Scar AI error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
