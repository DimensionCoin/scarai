"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import type { Trade, Summary } from "@/types/backtest";
import { useBacktestData } from "@/hooks/use-backtest-data";

type BacktestResultsProps = {
  view: "trades" | "results" | "education";
  activeTrades?: Trade[];
  completedTrades?: Trade[];
  currentPrice?: number;
  summary?: Summary[];
  totalProfit?: number;
  winRate?: number;
  amount?: number;
  selectedStrategies?: string[];
  trades?: Trade[];
};

export default function BacktestResults({
  view,
  activeTrades = [],
  completedTrades = [],
  currentPrice = 0,
  summary = [],
  totalProfit = 0,
  winRate = 0,
  amount = 0,
  selectedStrategies = [],
  trades = [],
}: BacktestResultsProps) {
  const { formatCurrency } = useBacktestData();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  if (view === "trades") {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Trades */}
          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 p-3">
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
              Active Trades ({activeTrades.length})
            </h3>

            {activeTrades.length > 0 ? (
              <div className="space-y-2">
                {activeTrades.map((trade, i) => (
                  <div
                    key={i}
                    className="bg-black/30 rounded-lg border border-white/10 p-2 text-xs"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-zinc-300">
                        {trade.strategy}
                      </span>
                      <span className="text-amber-400">Open</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-zinc-500">Entry:</span>{" "}
                        <span className="text-zinc-300">
                          ${trade.entryPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Direction:</span>{" "}
                        <span
                          className={`${
                            trade.direction === "long"
                              ? "text-teal-400"
                              : "text-rose-400"
                          }`}
                        >
                          {trade.direction.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Current:</span>{" "}
                        <span className="text-zinc-300">
                          ${currentPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">P/L:</span>{" "}
                        <span
                          className={`${
                            trade.direction === "long"
                              ? currentPrice - trade.entryPrice >= 0
                                ? "text-teal-400"
                                : "text-rose-400"
                              : trade.entryPrice - currentPrice >= 0
                              ? "text-teal-400"
                              : "text-rose-400"
                          }`}
                        >
                          {trade.direction === "long"
                            ? (
                                ((currentPrice - trade.entryPrice) /
                                  trade.entryPrice) *
                                100
                              ).toFixed(2)
                            : (
                                ((trade.entryPrice - currentPrice) /
                                  trade.entryPrice) *
                                100
                              ).toFixed(2)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 text-sm">
                No active trades
              </div>
            )}
          </div>

          {/* Completed Trades */}
          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 p-3">
            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <BarChart className="h-3.5 w-3.5 text-teal-400" />
              Completed Trades ({completedTrades.length})
            </h3>

            {completedTrades.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {completedTrades.map((trade, i) => (
                  <div
                    key={i}
                    className={`bg-black/30 rounded-lg border ${
                      trade.profitPercent >= 0
                        ? "border-teal-500/20"
                        : "border-rose-500/20"
                    } p-2 text-xs cursor-pointer hover:bg-black/40 transition-colors`}
                    onClick={() =>
                      setSelectedTrade(trade === selectedTrade ? null : trade)
                    }
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-zinc-300">
                        {trade.strategy}
                      </span>
                      <span
                        className={`${
                          trade.profitPercent >= 0
                            ? "text-teal-400"
                            : "text-rose-400"
                        }`}
                      >
                        {trade.profitPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-zinc-500">Entry:</span>{" "}
                        <span className="text-zinc-300">
                          ${trade.entryPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Exit:</span>{" "}
                        <span className="text-zinc-300">
                          ${trade.exitPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Direction:</span>{" "}
                        <span
                          className={`${
                            trade.direction === "long"
                              ? "text-teal-400"
                              : "text-rose-400"
                          }`}
                        >
                          {trade.direction.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Exit Reason:</span>{" "}
                        <span className="text-zinc-300">
                          {trade.exitReason}
                        </span>
                      </div>
                    </div>

                    {selectedTrade === trade && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-zinc-500">Entry Action:</span>{" "}
                            <span className="text-zinc-300">
                              {trade.entryAction}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Exit Action:</span>{" "}
                            <span className="text-zinc-300">
                              {trade.exitAction}
                            </span>
                          </div>
                          {trade.spotProfitPercent !== undefined && (
                            <>
                              <div>
                                <span className="text-zinc-500">
                                  Leveraged P/L:
                                </span>{" "}
                                <span
                                  className={`${
                                    trade.profitPercent >= 0
                                      ? "text-teal-400"
                                      : "text-rose-400"
                                  }`}
                                >
                                  {trade.profitPercent.toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500">Spot P/L:</span>{" "}
                                <span
                                  className={`${
                                    trade.spotProfitPercent >= 0
                                      ? "text-teal-400"
                                      : "text-rose-400"
                                  }`}
                                >
                                  {trade.spotProfitPercent.toFixed(2)}%
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="mt-2 text-zinc-400 text-[10px] italic">
                          Click to collapse details
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 text-sm">
                No completed trades
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "results") {
    return (
      <div className="p-4">
        {summary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Overall Performance */}
            <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 p-3">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">
                Overall Performance
              </h3>

              {/* Add a clear comparison between leveraged and spot results */}
              <div className="mb-4 p-3 bg-black/30 rounded-lg border border-white/10">
                <h4 className="text-xs font-medium text-zinc-300 mb-2">
                  Profit Comparison
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">
                      With Leverage ({summary[0]?.leverageUsed || 1}x)
                    </div>
                    <div
                      className={`text-lg font-medium ${
                        totalProfit >= 0 ? "text-teal-400" : "text-rose-400"
                      }`}
                    >
                      {formatCurrency((amount || 0) * (totalProfit / 100))}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {totalProfit.toFixed(2)}% return
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-500 mb-1">
                      Without Leverage (Spot)
                    </div>
                    <div
                      className={`text-lg font-medium ${
                        completedTrades.reduce(
                          (sum, t) => sum + (t.spotProfitPercent || 0),
                          0
                        ) >= 0
                          ? "text-teal-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(
                        completedTrades.reduce(
                          (sum, t) => sum + (t.spotProfitAmount || 0),
                          0
                        )
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {completedTrades
                        .reduce((sum, t) => sum + (t.spotProfitPercent || 0), 0)
                        .toFixed(2)}
                      % return
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-lg border border-white/10 p-2">
                  <div className="text-xs text-zinc-500 mb-1">Total Return</div>
                  <div
                    className={`text-lg font-medium ${
                      totalProfit >= 0 ? "text-teal-400" : "text-rose-400"
                    }`}
                  >
                    {totalProfit.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg border border-white/10 p-2">
                  <div className="text-xs text-zinc-500 mb-1">Win Rate</div>
                  <div className="text-lg font-medium text-teal-400">
                    {winRate.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg border border-white/10 p-2">
                  <div className="text-xs text-zinc-500 mb-1">Total Trades</div>
                  <div className="text-lg font-medium text-zinc-300">
                    {completedTrades.length}
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg border border-white/10 p-2">
                  <div className="text-xs text-zinc-500 mb-1">
                    Leverage Used
                  </div>
                  <div className="text-lg font-medium text-indigo-400">
                    {summary[0]?.leverageUsed || 1}x
                  </div>
                </div>
              </div>

              {/* Only show the leverage impact section if leverage > 1 */}
              {summary.length > 0 &&
                summary[0]?.leverageUsed &&
                summary[0]?.leverageUsed > 1 && (
                  <div className="mt-3 p-3 bg-indigo-500/10 border-2 border-indigo-500/30 rounded-lg">
                    <h4 className="text-xs font-medium text-indigo-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Leverage Impact
                    </h4>

                    {/* Add a difference calculation */}
                    <div className="bg-black/40 rounded-lg border border-white/10 p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400">
                          Difference due to leverage:
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            (amount || 0) * (totalProfit / 100) -
                              summary.reduce(
                                (sum, s) => sum + Number(s.spotProfit || 0),
                                0
                              ) >=
                            0
                              ? "text-teal-400"
                              : "text-rose-400"
                          }`}
                        >
                          {formatCurrency(
                            (amount || 0) * (totalProfit / 100) -
                              summary.reduce(
                                (sum, s) => sum + Number(s.spotProfit || 0),
                                0
                              )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Strategy Breakdown */}
            <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 p-3">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">
                Strategy Breakdown
              </h3>

              <div className="space-y-3">
                {summary.map((s, i) => (
                  <div
                    key={i}
                    className="bg-black/30 rounded-lg border border-white/10 p-2"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-zinc-300">
                        {s.strategyName}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          Number(s.totalReturn) >= 0
                            ? "bg-teal-500/10 text-teal-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {Number(s.totalReturn).toFixed(2)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-zinc-500">Trades:</span>{" "}
                        <span className="text-zinc-300">{s.tradeCount}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Win Rate:</span>{" "}
                        <span className="text-zinc-300">
                          {s.winRate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Profit:</span>{" "}
                        <span
                          className={`${
                            Number(s.profit) >= 0
                              ? "text-teal-400"
                              : "text-rose-400"
                          }`}
                        >
                          {formatCurrency(Number(s.profit))}
                        </span>
                      </div>
                    </div>

                    {/* Add spot trading comparison if leverage is used */}
                    {s.leverageUsed &&
                      s.leverageUsed > 1 &&
                      s.spotProfit !== undefined && (
                        <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-zinc-500">Spot Return:</span>{" "}
                            <span
                              className={`${
                                Number(s.spotReturn) >= 0
                                  ? "text-teal-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {Number(s.spotReturn).toFixed(2)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Spot Profit:</span>{" "}
                            <span
                              className={`${
                                Number(s.spotProfit) >= 0
                                  ? "text-teal-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {formatCurrency(Number(s.spotProfit))}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <p>Run a backtest to see results</p>
          </div>
        )}
      </div>
    );
  }

  // Educational view
  return (
    <div className="px-4 pb-4 pt-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy Explanations */}
        <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 p-3">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">
            Strategy Insights
          </h3>

          {selectedStrategies.includes("MACD Cross Strategy") && (
            <Card className="bg-black/30 border-teal-500/20 p-3 mb-3">
              <h4 className="text-sm font-medium text-teal-400 mb-2 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" />
                MACD Cross Strategy
              </h4>
              <p className="text-xs text-zinc-400 mb-2">
                The Moving Average Convergence Divergence (MACD) strategy
                identifies momentum changes by tracking the relationship between
                two moving averages of a price. When the MACD line crosses above
                the signal line, it generates a buy signal. When it crosses
                below, it generates a sell signal.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500">Entry Signal:</span>{" "}
                  <span className="text-teal-400">
                    MACD line crosses above signal line (buy)
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Exit Signal:</span>{" "}
                  <span className="text-rose-400">
                    MACD line crosses below signal line (sell)
                  </span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-black/40 rounded-md text-xs text-zinc-400">
                <p className="mb-1 font-medium text-zinc-300">How it works:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    Fast EMA (12 periods) and Slow EMA (26 periods) are
                    calculated
                  </li>
                  <li>MACD line = Fast EMA - Slow EMA</li>
                  <li>Signal line = 9-period EMA of MACD line</li>
                  <li>
                    When MACD crosses above signal line, buy signal is generated
                  </li>
                  <li>
                    When MACD crosses below signal line, sell signal is
                    generated
                  </li>
                </ol>
              </div>
            </Card>
          )}

          {selectedStrategies.includes("RSI Reversal Strategy") && (
            <Card className="bg-black/30 border-amber-500/20 p-3">
              <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                <ArrowUpRight className="h-3.5 w-3.5" />
                RSI Reversal Strategy
              </h4>
              <p className="text-xs text-zinc-400 mb-2">
                The Relative Strength Index (RSI) strategy identifies potential
                market reversals by measuring the speed and change of price
                movements. When RSI falls below 30, the market is considered
                oversold, generating a buy signal. When RSI rises above 70, the
                market is considered overbought, generating a sell signal.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500">Long Entry:</span>{" "}
                  <span className="text-teal-400">RSI below 30 (oversold)</span>
                </div>
                <div>
                  <span className="text-zinc-500">Short Entry:</span>{" "}
                  <span className="text-rose-400">
                    RSI above 70 (overbought)
                  </span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-black/40 rounded-md text-xs text-zinc-400">
                <p className="mb-1 font-medium text-zinc-300">How it works:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>RSI measures the magnitude of recent price changes</li>
                  <li>RSI values range from 0 to 100</li>
                  <li>
                    RSI below 30 indicates oversold conditions (potential buy)
                  </li>
                  <li>
                    RSI above 70 indicates overbought conditions (potential
                    sell)
                  </li>
                  <li>
                    The strategy exits when RSI crosses back above/below 50
                  </li>
                </ol>
              </div>
            </Card>
          )}

          {selectedStrategies.length === 0 && (
            <div className="text-center py-6 text-zinc-500 text-sm">
              Select strategies to see explanations
            </div>
          )}
        </div>

        {/* Trade Analysis */}
        <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 p-3">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">
            Trade Analysis
          </h3>

          {trades.length > 0 ? (
            <div className="space-y-3">
              <div className="bg-black/30 rounded-lg border border-white/10 p-3">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">
                  Exit Reasons
                </h4>

                <div className="space-y-2">
                  {Array.from(new Set(trades.map((t) => t.exitReason))).map(
                    (reason, i) => {
                      const count = trades.filter(
                        (t) => t.exitReason === reason
                      ).length;
                      const profitable = trades.filter(
                        (t) => t.exitReason === reason && t.profitPercent > 0
                      ).length;
                      const winRate =
                        count > 0 ? (profitable / count) * 100 : 0;
                      const avgProfit =
                        trades
                          .filter((t) => t.exitReason === reason)
                          .reduce((sum, t) => sum + t.profitPercent, 0) / count;

                      return (
                        <div key={i} className="bg-black/20 rounded-md p-2">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  winRate >= 50 ? "bg-teal-400" : "bg-rose-400"
                                }`}
                              ></span>
                              <span className="text-zinc-300 font-medium">
                                {reason}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400">
                                {count} trades
                              </span>
                              <span
                                className={`${
                                  winRate >= 50
                                    ? "text-teal-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {winRate.toFixed(0)}% win rate
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500">
                            Average profit:{" "}
                            <span
                              className={
                                avgProfit >= 0
                                  ? "text-teal-400"
                                  : "text-rose-400"
                              }
                            >
                              {avgProfit.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg border border-white/10 p-3">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">
                  Direction Performance
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {["long", "short"].map((direction) => {
                    const directionTrades = trades.filter(
                      (t) => t.direction === direction
                    );
                    const count = directionTrades.length;
                    const profitable = directionTrades.filter(
                      (t) => t.profitPercent > 0
                    ).length;
                    const winRate = count > 0 ? (profitable / count) * 100 : 0;
                    const totalReturn = directionTrades.reduce(
                      (sum, t) => sum + t.profitPercent,
                      0
                    );
                    const avgTrade = count > 0 ? totalReturn / count : 0;

                    return (
                      <div
                        key={direction}
                        className="bg-black/20 rounded-lg border border-white/10 p-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-zinc-300 flex items-center gap-1">
                            {direction === "long" ? (
                              <>
                                <ArrowUpRight className="h-3 w-3 text-teal-400" />{" "}
                                Long
                              </>
                            ) : (
                              <>
                                <ArrowDownRight className="h-3 w-3 text-rose-400" />{" "}
                                Short
                              </>
                            )}
                          </span>
                          <span
                            className={`text-xs ${
                              totalReturn >= 0
                                ? "text-teal-400"
                                : "text-rose-400"
                            }`}
                          >
                            {totalReturn.toFixed(2)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>
                            <span className="text-zinc-500">Trades:</span>{" "}
                            <span className="text-zinc-300">{count}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Win Rate:</span>{" "}
                            <span className="text-zinc-300">
                              {winRate.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Avg Trade:</span>{" "}
                            <span
                              className={
                                avgTrade >= 0
                                  ? "text-teal-400"
                                  : "text-rose-400"
                              }
                            >
                              {avgTrade.toFixed(2)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Best Trade:</span>{" "}
                            <span className="text-teal-400">
                              {count > 0
                                ? Math.max(
                                    ...directionTrades.map(
                                      (t) => t.profitPercent
                                    )
                                  ).toFixed(2)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg border border-white/10 p-3">
                <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Trading Tips
                </h4>
                <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
                  <li>Past performance does not guarantee future results</li>
                  <li>Consider using stop losses to protect your capital</li>
                  <li>Diversify your strategies to reduce risk</li>
                  <li>Test different market conditions before live trading</li>
                  <li>Monitor your emotional responses to wins and losses</li>
                  <li>Leverage amplifies both gains and losses</li>
                  <li>Combine technical indicators for better signals</li>
                  <li>Consider market volatility when setting stop losses</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-500 text-sm">
              Run a backtest to see trade analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
