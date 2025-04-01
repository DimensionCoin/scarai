// /lib/backtest/strategies/index.ts
export { macdCrossStrategyName } from "./macdCrossStrategy";
export { rsiReversalStrategyName } from "./rsiReversalStrategy";

export const strategyRegistry: Record<string, string> = {
  "MACD Cross Strategy": "macdCrossStrategy",
  "RSI Reversal Strategy": "rsiReversalStrategy",
};
