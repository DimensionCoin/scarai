// lib/backtest/runBacktests.ts

import { macdCrossStrategy } from "./strategies/macdCrossStrategy";
import { rsiReversalStrategy } from "./strategies/rsiReversalStrategy";

export type Trade = {
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  exitPrice: number;
  profitPercent: number;
  direction: "long" | "short";
};

export type BacktestResult = {
  trades: Trade[];
  totalReturn: number;
  winRate: number;
  strategyName: string;
};

type Strategy = (
  prices: number[][],
  config: {
    direction: "long" | "short" | "both";
    leverage: number;
  }
) => BacktestResult;

export function runBacktests(prices: number[][]): {
  bestStrategy: BacktestResult;
  summary: string;
  allResults: BacktestResult[];
} {
  const strategies: Strategy[] = [
    (p, c) => macdCrossStrategy(p, c),
    (p, c) => rsiReversalStrategy(p, c),
  ];

  const results = strategies.map(
    (strategy) => strategy(prices, { direction: "both", leverage: 1 }) // Default fallback
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
