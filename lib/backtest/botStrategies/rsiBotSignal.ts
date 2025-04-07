import { BotIndicatorData } from "./types";

export function rsiBotSignal(indicators: BotIndicatorData): string {
  const rsi = indicators.daily?.rsi;

  if (rsi === undefined || isNaN(rsi)) {
    return "- **RSI Strategy**: Unable to detect RSI.";
  }

  if (rsi < 30)
    return "- **RSI Strategy**: 🟢 RSI is oversold (<30) → potential LONG reversal setup.";
  if (rsi > 70)
    return "- **RSI Strategy**: 🔴 RSI is overbought (>70) → potential SHORT setup or take-profit zone.";
  if (rsi >= 50)
    return "- **RSI Strategy**: 🔼 RSI is trending up (50–70) → trend continuation.";
  return "- **RSI Strategy**: 🔽 RSI is weak (<50) → no setup yet.";
}
