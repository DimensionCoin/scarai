import type React from "react";
export type ExitReason =
  | "MACD cross"
  | "trend fade"
  | "stop loss hit"
  | "RSI target"
  | "RSI exit"
  | "time expiry";

export type Trade = {
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  exitPrice: number;
  profitPercent: number;
  spotProfitPercent?: number; // Add spot profit percent
  direction: "long" | "short";
  entryAction: "buy to open" | "sell to open";
  exitAction: "sell to close" | "buy to close";
  exitReason: ExitReason;
  strategy: string;
  positionSize?: number;
  profitAmount?: number;
  spotProfitAmount?: number; // Add spot profit amount
};

export type Summary = {
  strategyName: string;
  tradeCount: number;
  winRate: number;
  totalReturn: number;
  profit: number | string;
  spotReturn?: number; // Add spot return
  spotProfit?: number | string; // Add spot profit
  leverageUsed?: number; // Add leverage used
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
