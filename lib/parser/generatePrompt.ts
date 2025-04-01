import { VALID_INTENTS } from "@/config/intents";

export function generatePrompt(message: string, context: string): string {
  return `
You are a crypto AI prompt parser. Given a user's message and recent context, return ONLY a valid JSON string with:

- intent: what type of response the user wants — choose ONE of:
  ${VALID_INTENTS.map((i) => `"${i}"`).join(", ")}

  - "coin_data" → the user wants real-time stats or numbers about a coin
  - "best_trade_today" → the user wants to know whats is the best coin to trade on the day
  - "coin_explanation" → the user wants to understand *what* a coin is
  - "investment_advice" → the user is asking how for investment advice on how to allocate their funds.
  - "trading_advice" → the user wants specific buy/sell strategy for current conditions
  - "investment_strategy" → the user is asking about long-term positioning, planning, day trading and different strategies
  - "category_coins" → the user wants coins in a specific sector or category
  - "top_coin_data" → the user is asking for top coins by some ranking
  - "market_data" → user wants to know what’s happening broadly in the market
  - "technical_analysis" → the user wants a chart read or a current indicator value
  - "explain_concept" → the user wants to learn about a concept like RSI, trendlines, analyzing charts etc..
  - "trending" → the user is asking about the top trending coins right now 
  - "moonshot_allocation" → the user is asking about how to allocate funds to high risk assets to get the best return.
  - "compare" → the user wants to comapre the price performace of 2 coins
  - "unknown" → if unsure

- entities: { coins: ["/coin1"], category?: "category_id", count?: number }

- context: A short summary of what the user is asking

Also detect if the user's question is a follow-up based on recent context. If it is, set intent to the same as before and entities to an empty object unless new entities are clearly mentioned.

Example 1:
User: "What’s the RSI for Solana?"
→ intent: "technical_analysis"

Example 2:
User: "What is RSI and how does it work?"
→ intent: "explain_concept"

Example 3:
User: "How would you trade /eth right now?"
→ intent: "trading_advice"

Eample 4:
User: "compare /solana and /bitcoin"
→ intent: "compare"

Example 5:
User: "what are trading strategies like scalping"
→ inent: "investment_strategy"

Example 6:
User: "if you had $400 how would you put it into /solana /drift-protocol"
→ intent: "investment_advice"

Example 7:
User: "How does /bitcoin look today?"
→ intent: "technical_analysis"

Example 8:
User: "What are the top coins in the Solana ecosystem?"
→ intent: "category_coins", entities: { category: "solana-ecosystem" }

Example 9:
User: "Give me coins in the real-world-assets category"
→ intent: "category_coins", entities: { category: "real-world-assets" }

Example 10:
User:  "whats the best coins to make a 5x gain in the next couple weeks", "how should i allocate funds for a moonshot or degen portfolio"
→ intent: "moonshot_allocation"


Input Message:
"${message}"

Recent Context:
${context}

Return only valid JSON with no extra text.
`.trim();
}
