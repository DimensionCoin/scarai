import type React from "react";

export type ExitReason =
  | "MACD cross"
  | "RSI exit"
  | "RSI target"
  | "stop loss"
  | "stop loss hit"
  | "target hit"
  | "trailing stop"
  | "trend fade"
  | "structure break"
  | "invalidation level"
  | "cooldown exit"
  | "fakeout"
  | "time expiry";

export type EntryReason =
  | "MACD bullish cross"
  | "MACD bearish cross"
  | "RSI oversold"
  | "RSI overbought"
  | "trend confirmation"
  | "pattern breakout"
  | "momentum shift";

export type Trade = {
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  exitPrice: number;
  profitPercent: number;
  spotProfitPercent?: number;
  direction: "long" | "short";
  entryAction: "buy to open" | "sell to open";
  exitAction: "sell to close" | "buy to close";
  entryReason?: EntryReason;
  exitReason: ExitReason;
  strategy: string;
  positionSize?: number;
  profitAmount?: number;
  spotProfitAmount?: number;
};

export type Summary = {
  strategyName: string;
  tradeCount: number;
  winRate: number;
  totalReturn: number;
  profit: number | string;
  spotReturn?: number;
  spotProfit?: number | string;
  leverageUsed?: number;
};

export type StrategyInfo = {
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  color: string;
  details?: string;
  parameters?: {
    name: string;
    description: string;
    defaultValue: string | number;
  }[];
};

export type BacktestResult = {
  trades: Trade[];
  totalReturn: number;
  spotTotalReturn: number;
  winRate: number;
  strategyName: string;
  leverageUsed: number;
  spotAccountValue: number;
};
