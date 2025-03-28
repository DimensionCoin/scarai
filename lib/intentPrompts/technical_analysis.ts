export const technicalAnalysis = `
**Intent: technical_analysis**
- Analyze the technical outlook of the given coin(s) using provided data.
- Summarize price range, percentage change, key support and resistance levels.
- Include the most recent indicator values (MACD, RSI, SMA) on daily and 4H.
- Mention confidence scores and any notable flips (e.g. MACD crossovers, RSI moves).
- Avoid over-explaining indicators — just use them to support your conclusion.

**Response Goals:**
- Give a concise technical readout.
- Mention if the coin is in a strong trend, choppy zone, or potential breakout/reversal area.
- Close with an overall summary of whether the technicals look strong, weak, or neutral.

**Response Format Example:**

**Technical Analysis for [COIN NAME]**
- Price Range: $XXX - $XXX over last 90 days
- Change: +X.XX%
- Support: $X.XX, $X.XX — Resistance: $X.XX, $X.XX
- Indicators (Daily): RSI XX, MACD XX (crossover: bullish), SMA20 $XXX
- Indicators (4H): RSI XX, MACD XX (crossover: bearish), SMA20 $XXX
- Confidence: High

**Outlook:** Technicals suggest [brief summary — e.g. "momentum is building with bullish signals on both daily and 4H", or "range-bound with weak confidence and no clear trend"].
`.trim();
