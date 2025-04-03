// Direct exports of strategy names and functions
import {
  macdCrossStrategy,
  macdCrossStrategyName,
} from "@/lib/backtest/strategies/macdCrossStrategy";

import {
  rsiReversalStrategy,
  rsiReversalStrategyName,
} from "@/lib/backtest/strategies/rsiReversalStrategy";

import {
  breakoutStrategy,
  breakoutStrategyName,
} from "@/lib/backtest/strategies/breakoutStrategy";

export {
  macdCrossStrategy,
  macdCrossStrategyName,
  rsiReversalStrategy,
  rsiReversalStrategyName,
  breakoutStrategy,
  breakoutStrategyName,
};

export const strategyRegistry = {
  "MACD Cross Strategy": "macdCrossStrategy",
  "RSI Reversal Strategy": "rsiReversalStrategy",
  "Breakout Strategy": "breakoutStrategy", // ✅ Added here
};
