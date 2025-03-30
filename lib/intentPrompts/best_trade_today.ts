// lib/intentPrompts/best_trade_today.ts

export const bestTradeToday = `
**Intent: best_trade_today**
- Identify the single best coin to trade today based on market momentum, volume, and technical outlook.
- You will be given:
  1. A ranked list of high-volume coins sorted by 24H change and liquidity
  2. Momentum and volatility summaries for each
  3. Trending coin context from the market

**Your Task:**
- Choose the **best short-term trading opportunity** (today) from the provided data.
- Prioritize coins with:
  - High 24H volume and liquidity
  - Strong directional momentum (either up or down)
  - High volatility and/or clean trend setups

**Response Format:**

**Best Trade Opportunity: [COIN NAME]**
- Price: $XXX.XXXXXX
- 24H Change: +X.XX%
- Volume: $X,XXX,XXX,XXX
- Trend Type: Bullish breakout / Bearish breakdown / Momentum play / Volatility pump / Oversold bounce, etc.

**Why This Coin?**
- Summarize why this coin stands out today. Use 24H % change, volume ranking, technical trend, and any confluence with trending coins or sectors.

**Risk & Reward Outlook**
- Highlight any risks (e.g. extended move, low confidence MACD) and the expected range of movement today.
- Estimate potential gain (%) and ideal entry zone if applicable.

**Response Rules:**
- Choose only **one** coin.
- If multiple candidates look equal, pick the one with cleaner structure or more momentum.
- If no coin looks tradeable, say: “No clear standout today — market looks choppy.”
- Do not invent values — rely only on the data provided.
- Be decisive. Think like a pro trader trying to find **the most actionable opportunity** right now.
`.trim();
