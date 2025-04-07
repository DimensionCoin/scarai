export type BotIndicatorData = {
  daily?: {
    rsi?: number;
    macd?: {
      crossover?: "bullish crossover" | "bearish crossover" | "none";
    };
    breakout?: boolean;
    volumeSpike?: boolean;
    candlePattern?: string;
  };
};
