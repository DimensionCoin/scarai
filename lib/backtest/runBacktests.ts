import type { BacktestResult } from "@/types/backtest";
import { macdCrossStrategy } from "@/lib/backtest/strategies/macdCrossStrategy";
import { rsiReversalStrategy } from "@/lib/backtest/strategies/rsiReversalStrategy";

// Make sure the Strategy type uses the BacktestResult return type
type Strategy = (
  prices: number[][],
  config: {
    direction: "long" | "short" | "both";
    leverage: number;
    amount: number;
  }
) => BacktestResult;

export function runBacktests(
  prices: number[][],
  amount = 1000 // Add amount parameter with default
): {
  bestStrategy: BacktestResult;
  summary: string;
  allResults: BacktestResult[];
} {
  const strategies: Strategy[] = [
    (p, c) => macdCrossStrategy(p, c),
    (p, c) => rsiReversalStrategy(p, c),
  ];

  const results = strategies.map((strategy) =>
    strategy(prices, { direction: "both", leverage: 1, amount })
  );

  const sorted = [...results].sort((a, b) => b.totalReturn - a.totalReturn);
  const best = sorted[0];

  const summary = `📊 Best Strategy: ${best.strategyName}
- Total Return: ${best.totalReturn.toFixed(2)}%
- Win Rate: ${best.winRate.toFixed(2)}%
- Trade Count: ${best.trades.length}`;

  return {
    bestStrategy: best,
    summary,
    allResults: sorted,
  };
}
