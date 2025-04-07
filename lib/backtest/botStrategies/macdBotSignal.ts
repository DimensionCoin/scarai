import { BotIndicatorData } from "./types";

export function macdBotSignal(indicators: BotIndicatorData): string {
  const crossover = indicators.daily?.macd?.crossover;

  if (crossover === "bullish crossover") {
    return "- **MACD Strategy**: 🔼 Bullish crossover detected (daily) → favoring LONG setups.";
  } else if (crossover === "bearish crossover") {
    return "- **MACD Strategy**: 🔽 Bearish crossover detected (daily) → favoring SHORT setups.";
  }

  return "- **MACD Strategy**: No clear signal.";
}
