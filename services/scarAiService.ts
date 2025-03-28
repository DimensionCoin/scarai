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
  // Step 1: Parse intent/entities/context using DeepSeek
  const parsed = await parsePrompt(message, chatHistory);

  // Step 2: Get data + rules based on intent
  const { systemPrompt, data } = await getIntentData(parsed);

  // Step 3: Send everything to Grok to get a response
  const grokResponse = await callGrok({
    systemPrompt,
    context: parsed.context,
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
