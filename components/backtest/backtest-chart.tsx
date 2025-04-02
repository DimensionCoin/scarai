"use client";

import { useEffect, useRef, useCallback } from "react";
import { Play, Pause, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { Trade } from "@/types/backtest";

type BacktestChartProps = {
  prices: number[][];
  trades: Trade[];
  playIndex: number;
  setPlayIndex: (index: number) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  currentPrice: number;
  totalProfit: number;
  activeTrades: Trade[];
};

export default function BacktestChart({
  prices,
  trades,
  playIndex,
  setPlayIndex,
  playing,
  setPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  jumpToStart,
  jumpToEnd,
  currentPrice,
  totalProfit,
  activeTrades,
}: BacktestChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  const drawChart = useCallback(() => {
    const canvas = chartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const parentWidth = canvas.parentElement?.clientWidth || 800;
    const parentHeight = canvas.parentElement?.clientHeight || 400;
    canvas.width = parentWidth;
    canvas.height = parentHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Safety check: ensure prices array is not empty
    if (!prices || prices.length === 0) return;

    // Ensure playIndex is within bounds
    const safePlayIndex = Math.min(Math.max(0, playIndex), prices.length - 1);

    // Calculate visible range (show last 100 candles or all if less)
    const visibleCount = Math.min(100, prices.length);
    const startIdx = Math.max(0, safePlayIndex - visibleCount + 1);
    const endIdx = safePlayIndex;

    const visiblePrices = prices.slice(startIdx, endIdx + 1);

    // Safety check: ensure visiblePrices array is not empty
    if (!visiblePrices || visiblePrices.length === 0) return;

    // Find min and max prices in visible range
    const priceValues = visiblePrices
      .map((p) => (p && p.length > 1 ? p[1] : 0))
      .filter((p) => p !== 0);

    // Safety check: ensure priceValues array is not empty
    if (priceValues.length === 0) return;

    const minPrice = Math.min(...priceValues) * 0.99;
    const maxPrice = Math.max(...priceValues) * 1.01;
    const priceRange = maxPrice - minPrice;

    // Draw price chart
    const candleWidth = Math.max(2, (canvas.width - 60) / visiblePrices.length);
    const xOffset = 40;
    const yOffset = 20;
    const chartHeight = canvas.height - 40;

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 0.5;

    // Horizontal grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = yOffset + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(xOffset, y);
      ctx.lineTo(canvas.width - 20, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (i / gridLines) * priceRange;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`$${price.toFixed(2)}`, xOffset - 5, y + 3);
    }

    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
    ctx.lineWidth = 2;

    visiblePrices.forEach((price, i) => {
      // Safety check: ensure price array has at least 2 elements
      if (!price || price.length < 2) return;

      const x = xOffset + i * candleWidth + candleWidth / 2;
      const y =
        yOffset +
        chartHeight -
        ((price[1] - minPrice) / priceRange) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw current price marker
    if (
      visiblePrices.length > 0 &&
      visiblePrices[visiblePrices.length - 1] &&
      visiblePrices[visiblePrices.length - 1].length > 1
    ) {
      const currentPrice = visiblePrices[visiblePrices.length - 1][1];
      const x =
        xOffset + (visiblePrices.length - 1) * candleWidth + candleWidth / 2;
      const y =
        yOffset +
        chartHeight -
        ((currentPrice - minPrice) / priceRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99, 102, 241, 1)";
      ctx.fill();

      // Current price label
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`$${currentPrice.toFixed(2)}`, x + 8, y + 4);
    }

    // Draw trade markers
    const visibleTrades = trades.filter(
      (t) => t.entryIndex >= startIdx && t.entryIndex <= endIdx
    );

    visibleTrades.forEach((trade) => {
      const relativeEntryIndex = trade.entryIndex - startIdx;
      if (relativeEntryIndex < 0) return;

      // Safety check: ensure prices array has the entry index and price data
      if (!prices[trade.entryIndex] || prices[trade.entryIndex].length < 2)
        return;

      const x = xOffset + relativeEntryIndex * candleWidth + candleWidth / 2;
      const y =
        yOffset +
        chartHeight -
        ((prices[trade.entryIndex][1] - minPrice) / priceRange) * chartHeight;

      // Entry marker
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle =
        trade.profitPercent >= 0
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
      ctx.fill();

      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x, y - 15);
      ctx.strokeStyle =
        trade.profitPercent >= 0
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw arrowhead
      ctx.beginPath();
      if (trade.profitPercent >= 0) {
        ctx.moveTo(x - 4, y - 12);
        ctx.lineTo(x, y - 15);
        ctx.lineTo(x + 4, y - 12);
      } else {
        ctx.moveTo(x - 4, y - 11);
        ctx.lineTo(x, y - 8);
        ctx.lineTo(x + 4, y - 11);
      }
      ctx.fill();

      // Draw direction indicator
      const directionText = trade.direction === "long" ? "L" : "S";
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(x - 8, y + 8, 16, 16);
      ctx.fillStyle =
        trade.direction === "long"
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(directionText, x, y + 19);
    });

    // Draw active trade lines
    const activeTradesVisible = trades.filter(
      (t) => t.entryIndex <= endIdx && t.exitIndex > safePlayIndex
    );

    activeTradesVisible.forEach((trade) => {
      const relativeEntryIndex = Math.max(0, trade.entryIndex - startIdx);

      // Safety checks for prices array
      if (!prices[trade.entryIndex] || prices[trade.entryIndex].length < 2)
        return;
      if (!prices[safePlayIndex] || prices[safePlayIndex].length < 2) return;

      const entryX =
        xOffset + relativeEntryIndex * candleWidth + candleWidth / 2;
      const entryY =
        yOffset +
        chartHeight -
        ((prices[trade.entryIndex][1] - minPrice) / priceRange) * chartHeight;

      const currentX =
        xOffset + (visiblePrices.length - 1) * candleWidth + candleWidth / 2;
      const currentY =
        yOffset +
        chartHeight -
        ((prices[safePlayIndex][1] - minPrice) / priceRange) * chartHeight;

      // Draw dashed line from entry to current
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(entryX, entryY);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle =
        trade.direction === "long"
          ? "rgba(16, 185, 129, 0.5)"
          : "rgba(239, 68, 68, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw strategy label
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(entryX - 40, entryY - 25, 80, 18);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(trade.strategy.split(" ")[0], entryX, entryY - 12);
    });

    // Draw time labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";

    // Draw at most 5 time labels
    const timeLabels = Math.min(5, visiblePrices.length);
    for (let i = 0; i < timeLabels; i++) {
      const idx = Math.floor(
        (i * (visiblePrices.length - 1)) / (timeLabels - 1)
      );
      if (
        idx < 0 ||
        idx >= visiblePrices.length ||
        !visiblePrices[idx] ||
        visiblePrices[idx].length < 1
      )
        continue;

      const x = xOffset + idx * candleWidth + candleWidth / 2;
      const date = new Date(visiblePrices[idx][0]);
      const dateStr = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      ctx.fillText(dateStr, x, canvas.height - 5);
    }
  }, [prices, playIndex, trades]);

  useEffect(() => {
    if (prices && prices.length > 0 && chartRef.current) {
      drawChart();
    }
  }, [prices, playIndex, trades, drawChart]);

  // Ensure playIndex is within bounds
  const safePlayIndex = Math.min(
    Math.max(0, playIndex),
    prices && prices.length > 0 ? prices.length - 1 : 0
  );

  return (
    <>
      {/* Chart View */}
      <div className="flex-1 relative bg-black/20">
        <canvas ref={chartRef} className="w-full h-full" />

        {/* Price and Stats Overlay */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-2 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-zinc-400">Price:</span>
            <span className="font-mono text-teal-400 font-medium">
              ${currentPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">P/L:</span>
            <span
              className={`font-mono font-medium ${
                totalProfit >= 0 ? "text-teal-400" : "text-rose-400"
              }`}
            >
              {totalProfit.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="bg-black/30 border-t border-white/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={jumpToStart}
            className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => setPlaying(!playing)}
            className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={jumpToEnd}
            className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>

          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={prices && prices.length > 0 ? prices.length - 1 : 0}
              value={safePlayIndex}
              onChange={(e) => setPlayIndex(Number(e.target.value))}
              className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-black/40 rounded px-2 py-1">
            <span className="text-xs text-zinc-400">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-300 border-none focus:ring-0"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
            </select>
          </div>
        </div>

        {/* Active Trades */}
        <div className="flex flex-wrap gap-2">
          {activeTrades.map((trade, i) => (
            <div
              key={i}
              className="bg-black/40 backdrop-blur-sm rounded px-2 py-1 text-xs border border-white/10 flex items-center gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
              <span className="text-zinc-300">{trade.strategy}</span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400">
                Entry: ${trade.entryPrice.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
