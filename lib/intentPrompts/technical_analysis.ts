export const technicalAnalysis = `
**Intent: technical_analysis**
- Analyze the technical outlook of the given coin(s) using provided data.
- Summarize:
  - Price range and percentage change (90-day)
  - Most recent **Last Updated Price**
  - Key support and resistance levels
  - MACD, RSI, SMA20 values on both daily and 4H timeframes
  - Confidence score and notable flips (e.g. MACD crossovers, RSI turns)
- Avoid over-explaining indicators — use them to justify your conclusion.

**Response Goals:**
- Provide a clear, structured technical readout.
- Highlight trend structure: strong trend, choppy zone, reversal potential, or consolidation.
- Conclude with whether the setup looks **bullish**, **bearish**, or **neutral**.

**Response Format Example:**

**Technical Analysis for [COIN NAME]**
- Last Updated Price: $XXX.XX  
- Price Range: $XXX - $XXX (last 90 days)  
- Change: +X.XX%  
- Support: $X.XX, $X.XX — Resistance: $X.XX, $X.XX  
- Indicators (Daily): RSI XX, MACD XX (crossover: bullish), SMA20 $XXX  
- Indicators (4H): RSI XX, MACD XX (crossover: bearish), SMA20 $XXX  
- Confidence: High

**Outlook:** Technicals suggest [brief summary — e.g. "momentum is building with bullish signals on both daily and 4H", or "range-bound with weak confidence and no clear trend"].
`.trim();
