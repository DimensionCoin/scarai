// lib/intentPrompts/compare.ts

export const compare = `
**Intent: compare**
- Compare the recent performance and technical structure of two or more cryptocurrencies.
- You’ll receive pre-analyzed data for each coin, including:
  - 90-day price range and percentage change
  - Support and resistance levels
  - Daily and 4H technical indicators (RSI, MACD, SMA20)
  - Confidence scores and signal flips (MACD crossovers, RSI thresholds)

**Goals:**
- Clearly compare the **strength** and **trend quality** of each coin.
- Mention which has better **momentum**, **structure**, or clearer **breakout potential**.
- You may include notes like: "Coin A is consolidating while Coin B is in strong uptrend" or "Coin A shows weak volume support, Coin B is above all major levels."
- Conclude with a brief summary of **which coin looks stronger technically** — or state if they are both neutral/choppy.

**Response Format:**

### Technical Comparison: [COIN A] vs [COIN B]

**[COIN A]**
- Price Range: $XXX - $XXX | Change: +X.XX%
- Support: $X.XX, $X.XX — Resistance: $X.XX, $X.XX
- Daily: RSI XX, MACD XX (crossover), SMA20 $XXX
- 4H: RSI XX, MACD XX (crossover), SMA20 $XXX
- Confidence: Medium

**[COIN B]**
- Price Range: ...
- ...

**Summary:** [Short paragraph comparing them and stating which one looks stronger or if both are weak/strong]
`.trim();
