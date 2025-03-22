import OpenAI from "openai";
import { ChatMessage } from "@/types/chat";
import { matchCategoryFromQuery } from "@/utils/matchCategory";

function extractEntities(message: string) {
  const coins = message.match(/\/[a-zA-Z0-9-]+/g) || [];
  const users = message.match(/@[a-zA-Z0-9_]+/g) || [];

  return {
    coins: [...new Set(coins.map((c) => c.toLowerCase()))],
    users: [...new Set(users.map((u) => u.toLowerCase()))],
  };
}

function getLastUserMessage(chatHistory: ChatMessage[]) {
  return (
    [...chatHistory].reverse().find((m) => m.role === "user")?.content || ""
  );
}

export async function usePromptParser(
  message: string,
  chatHistory: ChatMessage[] = []
): Promise<{
  intent: string;
  entities: {
    coins: string[];
    users: string[];
    category?: string;
    count?: number; 
  };
  context: string;
}> {
  const client = new OpenAI({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: "https://api.x.ai/v1",
  });

  const { coins, users } = extractEntities(message);
  const lastUserMsg = getLastUserMessage(chatHistory);
  const fullHistory =
    chatHistory
      .slice(-2)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n") || "No prior context";

  const isFollowUp = /^(he|she|they|it|that|what about|what is it|okay)$/i.test(
    message.trim()
  );

  // ✅ Extract count (e.g., "top 25 gaming coins")
  const amountMatch = message.match(/top\s+(\d{1,3})/i);
  const count = amountMatch ? parseInt(amountMatch[1], 10) : undefined;

  // ✅ Handle category queries
  const matchedCategory = matchCategoryFromQuery(message);
  if (matchedCategory) {
    return {
      intent: "category_coins",
      entities: {
        coins,
        users,
        category: matchedCategory.category_id,
        ...(count ? { count } : {}),
      },
      context: `User is asking about top ${count ?? 10} coins in the ${
        matchedCategory.name
      } category`,
    };
  }

  // ✅ Fallback for "top coins" generally
  if (/top (coins|tokens|cryptos)/i.test(message)) {
    return {
      intent: "top_coin_data",
      entities: { coins, users, ...(count ? { count } : {}) },
      context: `User is asking for the top ${count ?? 10} coins by market cap`,
    };
  }
  // ✅ Fallback for "top coins" when no category is specified
  if (/top (coins|tokens|cryptos)/i.test(message)) {
    return {
      intent: "top_coin_data",
      entities: { coins, users },
      context: "User is asking for the top coins by market cap",
    };
  }

  // ✅ Handle follow-up messages
  if (
    isFollowUp &&
    (lastUserMsg.includes("/") || lastUserMsg.includes("@")) &&
    coins.length === 0 &&
    users.length === 0
  ) {
    const previousEntities = extractEntities(lastUserMsg);
    const fallbackIntent = previousEntities.users.length
      ? "x_posts"
      : previousEntities.coins.length
      ? "coin_data"
      : "unknown";

    return {
      intent: fallbackIntent,
      entities: {
        coins: [...new Set([...coins, ...previousEntities.coins])],
        users: [...new Set([...users, ...previousEntities.users])],
      },
      context: `Continuing conversation about ${
        previousEntities.coins[0] ||
        previousEntities.users[0] ||
        "unknown topic"
      }`,
    };
  }

  // 🔮 GPT fallback parser
  const systemPrompt = `
You are a crypto AI prompt parser. Given a user message and recent context, return ONLY a valid JSON string with:
- intent: one of: "coin_data", "trading_advice", "investment_advice", "x_posts", "compare", "mixed", "explain_concept", "market_trends", "top_coin_data", "category_coins", "unknown"
- entities: { coins: ["/coin1"], users: ["@user1"], category?: "category_id" }
- context: a short, clear summary of what the user wants

### Rules:
- "/coin" alone → intent: "coin_data"
- "what is /coin" → intent: "explain_concept"
- "should I buy /coin", "hold /coin" → intent: "investment_advice"
- "entry", "levels", "target" → intent: "trading_advice"
- "@user" alone → intent: "x_posts"
- "/coin vs /coin2", "@user1 vs @user2" → intent: "compare"
- "/coin @user" → intent: "mixed"
- "how is the market", "risk on", "macro", "yields" → intent: "market_trends"
- "top coins", "top cryptos", "top tokens" → intent: "top_coin_data"
- "top RWA coins", "best AI tokens", "popular DePIN projects" → intent: "category_coins"

Input:
Message: "${message}"
Last messages:
${fullHistory}

⚠️ Return valid JSON only. No markdown, comments, or extra text.
`;

  try {
    const completion = await client.chat.completions.create({
      model: "grok-2-latest",
      messages: [{ role: "system", content: systemPrompt }],
      max_tokens: 150,
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw
      .replace(/```json|```/g, "")
      .replace(/\n/g, "")
      .trim();

    if (!cleaned.startsWith("{") || !cleaned.includes("intent")) {
      console.error("❌ Grok returned invalid JSON:", cleaned);
      return {
        intent: "unknown",
        entities: { coins: [], users: [] },
        context: "Grok returned unstructured data — try again",
      };
    }

    function coerceToValidJSON(input: string): string {
      return input
        .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/:\s*([^,"{}\[\]\s]+)/g, ': "$1"');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      try {
        parsed = JSON.parse(coerceToValidJSON(cleaned));
      } catch (e) {
        console.error("❌ Could not parse fallback JSON:", cleaned);
        return {
          intent: "unknown",
          entities: { coins: [], users: [] },
          context: "Invalid fallback parser format",
        };
      }
    }

    const parsedCoins =
      Array.isArray(parsed?.entities?.coins) &&
      parsed.entities.coins.every((v: any) => typeof v === "string")
        ? parsed.entities.coins.map((c: string) => c.toLowerCase())
        : coins;

    const parsedUsers =
      Array.isArray(parsed?.entities?.users) &&
      parsed.entities.users.every((v: any) => typeof v === "string")
        ? parsed.entities.users.map((u: string) => u.toLowerCase())
        : users;

    return {
      intent: parsed.intent || "unknown",
      entities: {
        coins: [...new Set(parsedCoins)],
        users: [...new Set(parsedUsers)],
        ...(parsed.entities?.category && {
          category: parsed.entities.category,
        }),
        ...(parsed.entities?.count && { count: parsed.entities.count }),
      },
      context: parsed.context || "Unclear request",
    };
  } catch (error) {
    console.error("PromptParser Error:", error);
    return {
      intent: "unknown",
      entities: { coins, users },
      context: "Failed to parse — please try again",
    };
  }
}