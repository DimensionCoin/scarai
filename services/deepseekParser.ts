import OpenAI from "openai";
import { ChatMessage } from "@/types/chat";
import { generatePrompt } from "@/lib/parser/generatePrompt";
import { VALID_INTENTS, ChatIntent } from "@/config/intents";

export interface ParsedQuery {
  intent: ChatIntent;
  entities: {
    coins: string[];
    category?: string;
    count?: number;
  };
  context: string;
}

function coerceToValidJSON(input: string): string {
  return input
    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ': "$1"')
    .replace(/:\s*([^,"{}\[\]\s]+)/g, ': "$1"');
}

function getRecentContext(chatHistory: ChatMessage[]): string {
  return (
    chatHistory
      .slice(-2)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n") || "No prior context"
  );
}

export async function parsePrompt(
  message: string,
  chatHistory: ChatMessage[] = []
): Promise<ParsedQuery> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: "https://api.deepseek.com",
  });

  const recentContext = getRecentContext(chatHistory);
  const prompt = generatePrompt(message, recentContext);

  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 200,
      temperature: 0.1,
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const cleaned = raw
      .replace(/```(json)?/gi, "")
      .replace(/^.*?{/, "{")
      .replace(/\n/g, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = JSON.parse(coerceToValidJSON(cleaned));
    }

    const intent: ChatIntent = VALID_INTENTS.includes(parsed.intent)
      ? parsed.intent
      : "unknown";

    const coins =
      Array.isArray(parsed?.entities?.coins) &&
      parsed.entities.coins.every((v: any) => typeof v === "string")
        ? [
            ...new Set(
              parsed.entities.coins.map((c: string) =>
                c.replace("/", "").toLowerCase()
              )
            ),
          ]
        : [];

    return {
      intent,
      entities: {
        coins,
        ...(parsed.entities?.category && {
          category: parsed.entities.category,
        }),
        ...(parsed.entities?.count && { count: parsed.entities.count }),
      },
      context: parsed.context || "User asked a question",
    };
  } catch (err) {
    console.error("❌ DeepSeek prompt parse failed:", err);
    return {
      intent: "unknown",
      entities: { coins: [] },
      context: "Parsing failed — try again.",
    };
  }
}
