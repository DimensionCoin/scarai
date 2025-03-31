// lib/backtest/strategies/macdCrossStrategy.ts

import { calculateEMA } from "@/utils/calculateEMA";
import { BacktestResult, Trade } from "../runBacktests";

export function macdCrossStrategy(prices: number[][]): BacktestResult {
  const close = prices.map(([, price]) => price);
  if (close.length < 35) return emptyResult();

  const ema12 = calculateEMA(close, 12);
  const ema26 = calculateEMA(close, 26);
  const macd = ema12.map((v, i) => v - ema26[i]);
  const signal = calculateEMA(macd, 9);

  const trades: Trade[] = [];
  let inTrade = false;
  let entryIndex = 0;

  for (let i = 1; i < macd.length; i++) {
    const idx = i + (prices.length - macd.length); // align with original price index
    const price = prices[idx][1];

    const prevDiff = macd[i - 1] - signal[i - 1];
    const currDiff = macd[i] - signal[i];

    const crossedUp = prevDiff < 0 && currDiff > 0;
    const crossedDown = prevDiff > 0 && currDiff < 0;

    if (crossedUp && !inTrade) {
      entryIndex = idx;
      inTrade = true;
    }

    if (crossedDown && inTrade) {
      const entryPrice = prices[entryIndex][1];
      const exitPrice = price;
      const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;

      trades.push({
        entryIndex,
        exitIndex: idx,
        entryPrice,
        exitPrice,
        profitPercent: returnPct,
      });

      inTrade = false;
    }
  }

  // Exit at last candle if still holding
  if (inTrade) {
    const lastIndex = prices.length - 1;
    const entryPrice = prices[entryIndex][1];
    const exitPrice = prices[lastIndex][1];
    const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;

    trades.push({
      entryIndex,
      exitIndex: lastIndex,
      entryPrice,
      exitPrice,
      profitPercent: returnPct,
    });
  }

  const totalReturn = trades.reduce((sum, t) => sum + t.profitPercent, 0);
  const wins = trades.filter((t) => t.profitPercent > 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;

  return {
    trades,
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(2)),
    strategyName: "MACD Cross Strategy",
  };
}

function emptyResult(): BacktestResult {
  return {
    trades: [],
    totalReturn: 0,
    winRate: 0,
    strategyName: "MACD Cross Strategy",
  };
}
