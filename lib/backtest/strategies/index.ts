// Direct exports of strategy names and functions
import {
  macdCrossStrategy,
  macdCrossStrategyName,
} from "@/lib/backtest/strategies/macdCrossStrategy";
import {
  rsiReversalStrategy,
  rsiReversalStrategyName,
} from "@/lib/backtest/strategies/rsiReversalStrategy";

export {
  macdCrossStrategy,
  macdCrossStrategyName,
  rsiReversalStrategy,
  rsiReversalStrategyName,
};

export const strategyRegistry = {
  "MACD Cross Strategy": "macdCrossStrategy",
  "RSI Reversal Strategy": "rsiReversalStrategy",
};
