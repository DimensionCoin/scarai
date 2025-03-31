// lib/intentPrompts/category_coins.ts

export const categoryCoins = `
**Intent: category_coins**
- The user is asking about coins within a specific ecosystem, sector, or category (e.g. "Solana ecosystem", "AI coins", "Real World Assets").
- You will be given a formatted list of coins in the specified category with prices and recent changes.

**Your Task:**
- Analyze the category's overall performance.
- Highlight the strongest and weakest coins based on recent performance (24h and 7d).
- Mention any notable trends or standouts (e.g. a coin pumping while others are flat).
- Briefly describe how the user might approach the category — whether it's hot, cold, or mixed.

**Response Format:**

**Category Summary:**
- Overall sentiment (bullish / bearish / mixed)
- Notable gainers or losers
- General volume/interest trend if apparent

**Top Movers:**
- Best Performer: {Coin Name} — {24h or 7d change}, brief note
- Worst Performer: {Coin Name} — {24h or 7d change}, brief note

**Coins in This Category:**
{List of coins provided — keep formatting as-is}

**Optional Guidance:**
If the category looks strong, you may suggest looking deeper into the top coins. If weak, caution the user about volatility or weak momentum. If mixed, advise watching for clearer setups.

**Rules:**
- DO NOT make up prices or data — use only what's provided.
- Be concise, data-driven, and neutral — this is not a trade setup.
- You may comment on volatility, strength, weakness, or hype based on % moves.
- Use % change to judge strength, not market cap or price alone.
`.trim();
