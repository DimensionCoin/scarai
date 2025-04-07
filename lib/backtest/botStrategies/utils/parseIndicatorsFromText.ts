import { BotIndicatorData } from "../types";

export function parseIndicatorsFromText(text: string): BotIndicatorData {
  const lines = text.split("\n");

  const macdLine = lines.find((l) => l.includes("MACD:"));
  const rsiLine = lines.find((l) => l.includes("RSI:"));
  const breakoutLine = lines.find((l) => l.includes("Breakout Detected:"));
  const candleLine = lines.find((l) => l.includes("Candle Pattern:"));
  const volumeLine = lines.find((l) => l.includes("Volume Spike:"));

  const crossover = macdLine?.toLowerCase().includes("bullish")
    ? "bullish crossover"
    : macdLine?.toLowerCase().includes("bearish")
    ? "bearish crossover"
    : "none";

  const rsiMatch = rsiLine?.match(/RSI: ([\d.]+)/);
  const rsi = rsiMatch ? parseFloat(rsiMatch[1]) : undefined;

  return {
    daily: {
      macd: { crossover },
      rsi,
      breakout: breakoutLine?.includes("Yes") ?? false,
      volumeSpike: volumeLine?.includes("Yes") ?? false,
      candlePattern:
        candleLine?.split("Candle Pattern:")[1]?.trim() || undefined,
    },
  };
}
