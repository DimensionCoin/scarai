import { BotIndicatorData } from "./types";

export function breakoutBotSignal(indicators: BotIndicatorData): string {
  const isBreakout = indicators.daily?.breakout;
  const volumeSpike = indicators.daily?.volumeSpike;
  const pattern = indicators.daily?.candlePattern;

  if (isBreakout && volumeSpike) {
    return "- **Breakout Strategy**: 🚀 Breakout confirmed with volume spike → favoring LONG breakout trade.";
  }

  if (isBreakout) {
    return "- **Breakout Strategy**: ⚠️ Breakout detected but no volume confirmation → caution advised.";
  }

  if (pattern && pattern.toLowerCase().includes("engulfing")) {
    return `- **Breakout Strategy**: 📈 Engulfing pattern detected → possible early breakout signal.`;
  }

  return "- **Breakout Strategy**: No breakout or pattern signal detected.";
}
