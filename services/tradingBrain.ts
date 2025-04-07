import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: "https://api.deepseek.com/v1", // Replace with actual DeepSeek base if different
});

interface TradingBrainInput {
  coinData: string;
  technicalAnalysis: string;
  strategySignals: string;
  marketData: string;
}

interface TradingBrainOutput {
  technicalSummary: string;
  macroSummary: string;
  strategyAlignment: string;
}

export async function runTradingBrain({
  coinData,
  technicalAnalysis,
  strategySignals,
  marketData,
}: TradingBrainInput): Promise<TradingBrainOutput> {
  const systemPrompt = `
You are a crypto trading analyst. Your job is to summarize raw data into clear, compressed analysis for another AI (Grok) to use.

You will be given:
1. Coin market data and fundamentals
2. Full 90-day technical analysis with indicators
3. Macro and interest rate data
4. Strategy bot signals (e.g. "MACD suggests long", etc)

Your job:
- Parse and understand all input data.
- Output 3 summaries:
  1. **Technical Summary** → key insight from indicators, structure, momentum, fibs, etc.
  2. **Macro Summary** → clear read on macro and crypto market backdrop (risk-on/off, supportive or not).
  3. **Strategy Alignment** → which strategies agree or disagree, and if there's consensus (e.g. “MACD and RSI bullish, breakout cautious”).

Rules:
- Do NOT repeat full values, just describe key observations.
- Be concise but data-rich. Don’t speculate — summarize.
- Assume the output will be read by another AI (Grok), so avoid vagueness.

Output format:
{
  "technicalSummary": "....",
  "macroSummary": "....",
  "strategyAlignment": "...."
}
`.trim();

  const userPrompt = `
### Coin Data
${coinData}

---

### Technical Analysis
${technicalAnalysis}

---

### Market Data
${marketData}

---

### Strategy Views
${strategySignals}
`.trim();

  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 800,
  });

  const raw = completion.choices?.[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(raw);
    return {
      technicalSummary: parsed.technicalSummary ?? "No technical summary.",
      macroSummary: parsed.macroSummary ?? "No macro summary.",
      strategyAlignment: parsed.strategyAlignment ?? "No strategy summary.",
    };
  } catch (err) {
    console.error("❌ Failed to parse DeepSeek trading brain response:", err);
    return {
      technicalSummary: "Failed to summarize technicals.",
      macroSummary: "Failed to summarize macro.",
      strategyAlignment: "Failed to summarize strategy views.",
    };
  }
}
