import { parsePrompt } from "./deepseekParser";
import { getIntentData } from "./scarRouter";
import { ChatMessage } from "@/types/chat";
import { callGrok } from "./grokCaller"; // you’ll create this one
import { useValidation } from "@/hooks/useValidation";
import { deductCredits, logCreditUsage } from "@/actions/user.actions";
import { NextResponse } from "next/server";

interface ScarAiInput {
  userId: string;
  message: string;
  chatHistory?: ChatMessage[];
}

export async function processScarMessage({
  userId,
  message,
  chatHistory = [],
}: ScarAiInput) {
  const validationError = await useValidation(userId, message);
  if (validationError) {
    return NextResponse.json({ error: validationError.error }, { status: 403 });
  }

  const parsed = await parsePrompt(message, chatHistory);
  const { systemPrompt, data } = await getIntentData(parsed);

  // Get last 3 messages (user + assistant)
  const recentMessages = chatHistory
    .slice(-3)
    .map((msg) => {
      return `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`;
    })
    .join("\n");

  // Final Grok context includes:
  const fullContext = `
Previous Messages:
${recentMessages}

---

User Query Context:
${parsed.context}
`.trim();

  const grokResponse = await callGrok({
    systemPrompt,
    context: fullContext,
    data,
  });

  deductCredits(userId, 2).catch(() => null);
  logCreditUsage({
    userId,
    type: "oracle",
    message,
    creditsUsed: 2,
  }).catch(() => null);

  return {
    response: grokResponse,
    parsed,
    status: "ok",
  };
}
