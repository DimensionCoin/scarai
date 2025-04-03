"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import {
  Play,
  Pause,
  ChevronsLeft,
  ChevronsRight,
  Info,
  X,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Lock,
  Unlock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { Trade } from "@/types/backtest";
import { motion, AnimatePresence } from "framer-motion";

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
  completedTrades?: Trade[];
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
  completedTrades = [],
}: BacktestChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [viewRange, setViewRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(0);
  const [showAllTrades, setShowAllTrades] = useState(false);
  const [isViewRangeInitialized, setIsViewRangeInitialized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{
    visible: boolean;
    x: number;
    y: number;
    price: number;
    date: string;
    trade?: Trade;
  }>({ visible: false, x: 0, y: 0, price: 0, date: "" });
  // Remove the unused chartMode state variable
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 0, y: 0 });
  const [chartLocked, setChartLocked] = useState(true);

  // Handle zoom in/out
  const handleZoomIn = useCallback(() => {
    if (chartLocked) return;
    setZoomLevel((prev) => Math.min(prev * 1.5, 5));

    // Adjust view range to zoom around current center
    setViewRange((prev) => {
      const center = (prev.start + prev.end) / 2;
      const newRange = (prev.end - prev.start) / 1.5;
      const newStart = Math.max(0, Math.floor(center - newRange / 2));
      const newEnd = Math.min(
        prices.length - 1,
        Math.ceil(center + newRange / 2)
      );
      return { start: newStart, end: newEnd };
    });
  }, [chartLocked, prices.length]);

  const handleZoomOut = useCallback(() => {
    if (chartLocked) return;
    setZoomLevel((prev) => Math.max(prev / 1.5, 0.5));

    // Adjust view range to zoom around current center
    setViewRange((prev) => {
      const center = (prev.start + prev.end) / 2;
      const newRange = Math.min((prev.end - prev.start) * 1.5, prices.length);
      const newStart = Math.max(0, Math.floor(center - newRange / 2));
      const newEnd = Math.min(
        prices.length - 1,
        Math.ceil(center + newRange / 2)
      );
      return { start: newStart, end: newEnd };
    });
  }, [chartLocked, prices.length]);

  const handleResetZoom = useCallback(() => {
    if (chartLocked) return;
    setZoomLevel(1);
    setViewRange({ start: 0, end: prices.length - 1 });
  }, [chartLocked, prices.length]);

  // Check if simulation is complete when playIndex changes
  useEffect(() => {
    if (prices.length > 0 && playIndex >= prices.length - 1) {
      setSimulationComplete(true);
      setChartLocked(false);
    } else if (playing) {
      setSimulationComplete(false);
      setChartLocked(true);
    }
  }, [playIndex, prices.length, playing]);

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

    // Calculate visible range based on viewRange or default to last 100 candles
    let startIdx, endIdx;

    if (showAllTrades) {
      // Show all data
      startIdx = 0;
      endIdx = prices.length - 1;
    } else if (viewRange.start !== viewRange.end) {
      // Use custom view range if set
      startIdx = viewRange.start;
      endIdx = viewRange.end;
    } else {
      // Default: show last 100 candles or all if less
      const visibleCount = Math.min(Math.floor(100 / zoomLevel), prices.length);
      startIdx = Math.max(0, safePlayIndex - visibleCount + 1);
      endIdx = safePlayIndex;
    }

    const visiblePrices = prices.slice(startIdx, endIdx + 1);

    // Safety check: ensure visiblePrices array is not empty
    if (!visiblePrices || visiblePrices.length === 0) return;

    // Find min and max prices in visible range
    const priceValues = visiblePrices
      .map((p) => (p && p.length > 1 ? p[1] : 0))
      .filter((p) => p !== 0);

    // Safety check: ensure priceValues array is not empty
    if (priceValues.length === 0) return;

    const minPrice = Math.min(...priceValues) * 0.995;
    const maxPrice = Math.max(...priceValues) * 1.005;
    const priceRange = maxPrice - minPrice;

    // Draw price chart
    const candleWidth = Math.max(2, (canvas.width - 80) / visiblePrices.length);
    const xOffset = 60;
    const yOffset = 30;
    const chartHeight = canvas.height - 60;

    // Draw futuristic grid
    ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (
      let i = 0;
      i <= visiblePrices.length;
      i += Math.max(1, Math.floor(visiblePrices.length / 10))
    ) {
      const x = xOffset + i * candleWidth;
      ctx.beginPath();
      ctx.moveTo(x, yOffset);
      ctx.lineTo(x, yOffset + chartHeight);
      ctx.stroke();
    }

    // Horizontal grid lines with gradient
    const gridLines = 5;
    const gradient = ctx.createLinearGradient(
      0,
      yOffset,
      0,
      yOffset + chartHeight
    );
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.1)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.02)");

    for (let i = 0; i <= gridLines; i++) {
      const y = yOffset + (chartHeight / gridLines) * i;

      // Main grid line
      ctx.beginPath();
      ctx.strokeStyle = "rgba(99, 102, 241, 0.1)";
      ctx.moveTo(xOffset, y);
      ctx.lineTo(canvas.width - 20, y);
      ctx.stroke();

      // Price labels with futuristic background
      const price = maxPrice - (i / gridLines) * priceRange;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      const priceText = `$${price.toFixed(2)}`;
      const textWidth = ctx.measureText(priceText).width;
      ctx.fillRect(xOffset - textWidth - 10, y - 8, textWidth + 8, 16);

      // Add subtle glow effect
      ctx.fillStyle = "rgba(99, 102, 241, 0.8)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(priceText, xOffset - 5, y + 3);
    }

    // Draw price line with gradient
    const lineGradient = ctx.createLinearGradient(
      0,
      yOffset,
      0,
      yOffset + chartHeight
    );
    lineGradient.addColorStop(0, "rgba(16, 185, 129, 0.8)");
    lineGradient.addColorStop(1, "rgba(99, 102, 241, 0.8)");

    ctx.beginPath();
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;

    visiblePrices.forEach((price, i) => {
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

    // Add subtle area fill under the line
    ctx.lineTo(
      xOffset + (visiblePrices.length - 1) * candleWidth + candleWidth / 2,
      yOffset + chartHeight
    );
    ctx.lineTo(xOffset, yOffset + chartHeight);
    ctx.closePath();

    const areaGradient = ctx.createLinearGradient(
      0,
      yOffset,
      0,
      yOffset + chartHeight
    );
    areaGradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
    areaGradient.addColorStop(1, "rgba(99, 102, 241, 0.05)");
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // Draw current price marker with glow effect
    if (
      visiblePrices.length > 0 &&
      visiblePrices[visiblePrices.length - 1]?.length > 1
    ) {
      const currentPrice = visiblePrices[visiblePrices.length - 1][1];
      const x =
        xOffset + (visiblePrices.length - 1) * candleWidth + candleWidth / 2;
      const y =
        yOffset +
        chartHeight -
        ((currentPrice - minPrice) / priceRange) * chartHeight;

      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99, 102, 241, 0.3)";
      ctx.fill();

      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99, 102, 241, 1)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Current price label with futuristic style
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      const priceText = `$${currentPrice.toFixed(2)}`;
      const textWidth = ctx.measureText(priceText).width;
      ctx.fillRect(x + 8, y - 8, textWidth + 10, 16);

      ctx.fillStyle = "rgba(99, 102, 241, 1)";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(priceText, x + 12, y + 4);
    }

    // Draw all completed trades with enhanced visuals
    if (completedTrades && completedTrades.length > 0) {
      completedTrades.forEach((trade) => {
        if (trade.entryIndex === undefined || trade.exitIndex === undefined)
          return;
        if (trade.entryIndex < startIdx || trade.exitIndex > endIdx) return;

        const relativeEntryIndex = trade.entryIndex - startIdx;
        const relativeExitIndex = trade.exitIndex - startIdx;

        if (!prices[trade.entryIndex] || !prices[trade.exitIndex]) return;

        const entryX =
          xOffset + relativeEntryIndex * candleWidth + candleWidth / 2;
        const entryY =
          yOffset +
          chartHeight -
          ((prices[trade.entryIndex][1] - minPrice) / priceRange) * chartHeight;

        const exitX =
          xOffset + relativeExitIndex * candleWidth + candleWidth / 2;
        const exitY =
          yOffset +
          chartHeight -
          ((prices[trade.exitIndex][1] - minPrice) / priceRange) * chartHeight;

        // Draw line connecting entry and exit with gradient
        const isProfit = trade.profitPercent >= 0;
        const tradeGradient = ctx.createLinearGradient(
          entryX,
          entryY,
          exitX,
          exitY
        );

        if (isProfit) {
          tradeGradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
          tradeGradient.addColorStop(1, "rgba(16, 185, 129, 0.8)");
        } else {
          tradeGradient.addColorStop(0, "rgba(239, 68, 68, 0.2)");
          tradeGradient.addColorStop(1, "rgba(239, 68, 68, 0.8)");
        }

        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(entryX, entryY);
        ctx.lineTo(exitX, exitY);
        ctx.strokeStyle = tradeGradient;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw entry marker with different shapes for long vs short
        if (trade.direction === "long") {
          // Triangle pointing up for long trades with glow
          ctx.beginPath();
          ctx.moveTo(entryX, entryY - 9); // Top point
          ctx.lineTo(entryX - 6, entryY + 1); // Bottom left
          ctx.lineTo(entryX + 6, entryY + 1); // Bottom right
          ctx.closePath();

          // Glow effect
          ctx.shadowColor = "rgba(16, 185, 129, 0.8)";
          ctx.shadowBlur = 8;

          ctx.fillStyle = "rgba(16, 185, 129, 0.8)"; // Green for long
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Triangle pointing down for short trades with glow
          ctx.beginPath();
          ctx.moveTo(entryX, entryY + 9); // Bottom point
          ctx.lineTo(entryX - 6, entryY - 1); // Top left
          ctx.lineTo(entryX + 6, entryY - 1); // Top right
          ctx.closePath();

          // Glow effect
          ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
          ctx.shadowBlur = 8;

          ctx.fillStyle = "rgba(239, 68, 68, 0.8)"; // Red for short
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw exit marker with glow effect
        ctx.beginPath();
        ctx.arc(exitX, exitY, 5, 0, Math.PI * 2);

        // Glow effect
        ctx.shadowColor = isProfit
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
        ctx.shadowBlur = 8;

        ctx.fillStyle = isProfit
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Strategy label with futuristic style
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(entryX - 40, entryY - 25, 80, 18);

        // Add subtle glow to text
        ctx.shadowColor =
          trade.direction === "long"
            ? "rgba(16, 185, 129, 0.8)"
            : "rgba(239, 68, 68, 0.8)";
        ctx.shadowBlur = 3;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `${trade.strategy.split(" ")[0]} ${
            trade.direction === "long" ? "↑" : "↓"
          }`,
          entryX,
          entryY - 12
        );
        ctx.shadowBlur = 0;

        // Profit/loss label with enhanced style
        const profitLabel = `${trade.profitPercent.toFixed(1)}%`;
        const labelWidth = ctx.measureText(profitLabel).width + 10;

        // Label background with gradient
        const labelGradient = ctx.createLinearGradient(
          exitX - labelWidth / 2,
          exitY + 10,
          exitX + labelWidth / 2,
          exitY + 28
        );
        if (isProfit) {
          labelGradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
          labelGradient.addColorStop(1, "rgba(16, 185, 129, 0.4)");
        } else {
          labelGradient.addColorStop(0, "rgba(239, 68, 68, 0.2)");
          labelGradient.addColorStop(1, "rgba(239, 68, 68, 0.4)");
        }

        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(exitX - labelWidth / 2, exitY + 10, labelWidth, 18);

        // Add subtle glow to text
        ctx.shadowColor = isProfit
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
        ctx.shadowBlur = 3;
        ctx.fillStyle = isProfit
          ? "rgba(16, 185, 129, 0.9)"
          : "rgba(239, 68, 68, 0.9)";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(profitLabel, exitX, exitY + 22);
        ctx.shadowBlur = 0;
      });
    }

    // Draw active trade lines with enhanced visuals
    const activeTradesVisible = trades.filter((t) => {
      if (t.entryIndex === undefined || t.exitIndex === undefined) return false;
      return t.entryIndex <= endIdx && t.exitIndex > safePlayIndex;
    });

    activeTradesVisible.forEach((trade) => {
      const relativeEntryIndex = Math.max(0, trade.entryIndex - startIdx);

      if (!prices[trade.entryIndex] || !prices[safePlayIndex]) return;

      const entryX =
        xOffset + relativeEntryIndex * candleWidth + candleWidth / 2;
      const entryY =
        yOffset +
        chartHeight -
        ((prices[trade.entryIndex][1] - minPrice) / priceRange) * chartHeight;

      const currentX =
        xOffset +
        (Math.min(endIdx, safePlayIndex) - startIdx) * candleWidth +
        candleWidth / 2;
      const currentY =
        yOffset +
        chartHeight -
        ((prices[safePlayIndex][1] - minPrice) / priceRange) * chartHeight;

      // Draw animated dashed line from entry to current
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(entryX, entryY);
      ctx.lineTo(currentX, currentY);

      // Glowing line for active trades
      ctx.shadowColor =
        trade.direction === "long"
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
      ctx.shadowBlur = 5;
      ctx.strokeStyle =
        trade.direction === "long"
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);

      // Draw active trade entry marker with enhanced visuals
      if (trade.direction === "long") {
        // Triangle pointing up for long trades with glow
        ctx.beginPath();
        ctx.moveTo(entryX, entryY - 9); // Top point
        ctx.lineTo(entryX - 6, entryY + 1); // Bottom left
        ctx.lineTo(entryX + 6, entryY + 1); // Bottom right
        ctx.closePath();

        // Pulsing glow effect
        const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        ctx.shadowColor = "rgba(16, 185, 129, 0.8)";
        ctx.shadowBlur = 8 * pulseIntensity;

        ctx.fillStyle = "rgba(16, 185, 129, 0.8)"; // Green for long
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Triangle pointing down for short trades with glow
        ctx.beginPath();
        ctx.moveTo(entryX, entryY + 9); // Bottom point
        ctx.lineTo(entryX - 6, entryY - 1); // Top left
        ctx.lineTo(entryX + 6, entryY - 1); // Top right
        ctx.closePath();

        // Pulsing glow effect
        const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
        ctx.shadowBlur = 8 * pulseIntensity;

        ctx.fillStyle = "rgba(239, 68, 68, 0.8)"; // Red for short
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Strategy label with futuristic style
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(entryX - 40, entryY - 25, 80, 18);

      // Add subtle glow to text
      ctx.shadowColor =
        trade.direction === "long"
          ? "rgba(16, 185, 129, 0.8)"
          : "rgba(239, 68, 68, 0.8)";
      ctx.shadowBlur = 3;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${trade.strategy.split(" ")[0]} ${
          trade.direction === "long" ? "↑" : "↓"
        }`,
        entryX,
        entryY - 12
      );
      ctx.shadowBlur = 0;
    });

    // Draw time labels with futuristic style
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";

    // Draw time labels with enhanced visuals
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

      // Label background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      const textWidth = ctx.measureText(dateStr).width;
      ctx.fillRect(
        x - textWidth / 2 - 4,
        canvas.height - 20,
        textWidth + 8,
        16
      );

      // Label text with subtle glow
      ctx.shadowColor = "rgba(99, 102, 241, 0.8)";
      ctx.shadowBlur = 2;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText(dateStr, x, canvas.height - 8);
      ctx.shadowBlur = 0;
    }

    // Draw view range indicator with enhanced visuals
    if (viewRange.start !== viewRange.end) {
      // Background track
      ctx.fillStyle = "rgba(99, 102, 241, 0.1)";
      ctx.fillRect(0, canvas.height - 3, canvas.width, 3);

      // Active range with gradient
      const totalWidth = canvas.width;
      const startX = (viewRange.start / prices.length) * totalWidth;
      const endX = (viewRange.end / prices.length) * totalWidth;

      const rangeGradient = ctx.createLinearGradient(startX, 0, endX, 0);
      rangeGradient.addColorStop(0, "rgba(99, 102, 241, 0.5)");
      rangeGradient.addColorStop(0.5, "rgba(99, 102, 241, 0.8)");
      rangeGradient.addColorStop(1, "rgba(99, 102, 241, 0.5)");

      ctx.fillStyle = rangeGradient;
      ctx.fillRect(startX, canvas.height - 3, endX - startX, 3);

      // Add handles at start and end
      ctx.beginPath();
      ctx.arc(startX, canvas.height - 1.5, 4, 0, Math.PI * 2);
      ctx.arc(endX, canvas.height - 1.5, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99, 102, 241, 1)";
      ctx.fill();
    }

    // Draw crosshair if enabled
    if (showCrosshair) {
      const { x, y } = crosshairPosition;

      // Only draw if within chart area
      if (
        x >= xOffset &&
        x <= canvas.width - 20 &&
        y >= yOffset &&
        y <= yOffset + chartHeight
      ) {
        // Vertical line
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.moveTo(x, yOffset);
        ctx.lineTo(x, yOffset + chartHeight);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(xOffset, y);
        ctx.lineTo(canvas.width - 20, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Price at crosshair
        const price = maxPrice - ((y - yOffset) / chartHeight) * priceRange;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        const priceText = `$${price.toFixed(2)}`;
        const textWidth = ctx.measureText(priceText).width;
        ctx.fillRect(xOffset - textWidth - 10, y - 8, textWidth + 8, 16);

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(priceText, xOffset - 5, y + 3);
      }
    }
  }, [
    prices,
    playIndex,
    trades,
    completedTrades,
    viewRange,
    showAllTrades,
    zoomLevel,
    showCrosshair,
    crosshairPosition,
  ]);

  // Effect for drawing the chart
  useEffect(() => {
    if (prices && prices.length > 0 && chartRef.current) {
      drawChart();

      // Set up animation frame for pulsing effects
      const animationFrame = requestAnimationFrame(() => {
        if (!playing) drawChart();
      });

      return () => cancelAnimationFrame(animationFrame);
    }
  }, [prices, playIndex, trades, drawChart, playing]);

  // Effect for mouse event listeners
  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas) return;

    // Add double tap detection
    let lastTapTime = 0;
    const handleDoubleTap = (e: TouchEvent) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;

      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        e.preventDefault();
        if (!chartLocked) {
          handleResetZoom();
        }
      }

      lastTapTime = currentTime;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (chartLocked) return;

      setIsPanning(true);
      setPanStart(e.offsetX);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    const handleMouseLeave = () => {
      setIsPanning(false);
      setHoverInfo({ ...hoverInfo, visible: false });
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Update crosshair position
      if (showCrosshair && !playing) {
        setCrosshairPosition({ x: e.offsetX, y: e.offsetY });
      }

      // Handle panning
      if (isPanning && !chartLocked) {
        const dx = e.offsetX - panStart;
        const canvasWidth = canvas.width - 60; // Adjust for chart margins
        const visibleCount = viewRange.end - viewRange.start || 100;
        const moveAmount = Math.round((dx / canvasWidth) * visibleCount) * -1;

        if (moveAmount !== 0) {
          setViewRange((prev) => {
            // If viewRange is not set yet, initialize it
            if (prev.start === 0 && prev.end === 0) {
              const visibleCount = Math.min(100, prices.length);
              const start = Math.max(0, playIndex - visibleCount + 1);
              const end = playIndex;
              prev = { start, end };
            }

            const newStart = Math.max(0, prev.start + moveAmount);
            const newEnd = Math.min(prices.length - 1, prev.end + moveAmount);

            // If we hit the boundary, don't update
            if (newStart === prev.start && newEnd === prev.end) return prev;

            setPanStart(e.offsetX);
            return { start: newStart, end: newEnd };
          });
        }
      }

      // Update hover info for tooltips
      if (!isPanning && simulationComplete) {
        const xOffset = 60;
        const yOffset = 30;
        const chartHeight = canvas.height - 60;
        const candleWidth = Math.max(
          2,
          (canvas.width - 80) / (viewRange.end - viewRange.start + 1)
        );

        // Calculate which price point we're hovering over
        const hoverIndex =
          Math.floor((e.offsetX - xOffset) / candleWidth) + viewRange.start;

        if (
          hoverIndex >= 0 &&
          hoverIndex < prices.length &&
          e.offsetX >= xOffset &&
          e.offsetY >= yOffset &&
          e.offsetY <= yOffset + chartHeight
        ) {
          const price = prices[hoverIndex][1];
          const date = new Date(prices[hoverIndex][0]).toLocaleString();

          // Check if hovering over a trade
          let hoverTrade: Trade | undefined;

          completedTrades.forEach((trade) => {
            if (
              Math.abs(trade.entryIndex - hoverIndex) <= 2 ||
              Math.abs(trade.exitIndex - hoverIndex) <= 2
            ) {
              hoverTrade = trade;
            }
          });

          setHoverInfo({
            visible: true,
            x: e.offsetX,
            y: e.offsetY,
            price,
            date,
            trade: hoverTrade,
          });
        } else {
          setHoverInfo({ ...hoverInfo, visible: false });
        }
      }
    };

    // Add wheel event for zooming with mouse scroll
    const handleWheel = (e: WheelEvent) => {
      if (chartLocked) return;
      e.preventDefault();

      // Zoom in or out based on wheel direction
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    };

    // Add touch events for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let initialPinchDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Prevent default browser pinch-zoom behavior when there are multiple touches
      if (e.touches.length > 1) {
        e.preventDefault();
      }

      if (chartLocked) return;

      // Check for double tap
      handleDoubleTap(e);

      if (e.touches.length === 1) {
        // Single touch - prepare for pan and update crosshair
        const rect = canvas.getBoundingClientRect();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        // Update crosshair position
        setCrosshairPosition({
          x: touchStartX - rect.left,
          y: touchStartY - rect.top,
        });

        setIsPanning(true);
        setPanStart(touchStartX);
      } else if (e.touches.length === 2) {
        // Two touches - prepare for pinch zoom
        initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent default browser behavior for multi-touch gestures
      if (e.touches.length > 1) {
        e.preventDefault();
      }

      if (chartLocked) return;

      if (e.touches.length === 1) {
        // Update crosshair position to follow finger
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;

        // Update crosshair position
        setCrosshairPosition({ x: touchX, y: touchY });

        if (isPanning) {
          // Handle panning
          const touchX = e.touches[0].clientX;
          const dx = touchX - panStart;

          const canvasWidth = canvas.width - 60;
          const visibleCount = viewRange.end - viewRange.start || 100;
          const moveAmount = Math.round((dx / canvasWidth) * visibleCount) * -1;

          if (moveAmount !== 0) {
            setViewRange((prev) => {
              if (prev.start === 0 && prev.end === 0) {
                const visibleCount = Math.min(100, prices.length);
                const start = Math.max(0, playIndex - visibleCount + 1);
                const end = playIndex;
                prev = { start, end };
              }

              const newStart = Math.max(0, prev.start + moveAmount);
              const newEnd = Math.min(prices.length - 1, prev.end + moveAmount);

              if (newStart === prev.start && newEnd === prev.end) return prev;

              setPanStart(touchX);
              return { start: newStart, end: newEnd };
            });
          }
        }
      } else if (e.touches.length === 2) {
        // Handle pinch zoom
        const currentPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        if (initialPinchDistance > 0) {
          const pinchRatio = currentPinchDistance / initialPinchDistance;

          if (pinchRatio > 1.05) {
            // Zoom in
            handleZoomIn();
            initialPinchDistance = currentPinchDistance;
          } else if (pinchRatio < 0.95) {
            // Zoom out
            handleZoomOut();
            initialPinchDistance = currentPinchDistance;
          }
        }
      }
    };

    const handleTouchEnd = () => {
      setIsPanning(false);
    };

    // Add these event listeners to the canvas
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isPanning,
    panStart,
    viewRange,
    prices.length,
    playIndex,
    chartLocked,
    showCrosshair,
    playing,
    simulationComplete,
    hoverInfo,
    completedTrades,
    handleResetZoom,
    handleZoomIn,
    handleZoomOut,
    prices,
  ]);

  // Effect for initializing viewRange
  useEffect(() => {
    // Only initialize viewRange if it's not already set and we have prices
    if (!isViewRangeInitialized && prices.length > 0) {
      const visibleCount = Math.min(100, prices.length);
      const start = Math.max(0, playIndex - visibleCount + 1);
      const end = playIndex;
      setViewRange({ start, end });
      setIsViewRangeInitialized(true);
    }
  }, [playIndex, prices.length, isViewRangeInitialized]);

  // Reset initialization when prices change
  useEffect(() => {
    if (prices.length === 0) {
      setIsViewRangeInitialized(false);
    }
  }, [prices.length]);

  // Ensure playIndex is within bounds
  const safePlayIndex = Math.min(
    Math.max(0, playIndex),
    prices && prices.length > 0 ? prices.length - 1 : 0
  );

  return (
    <>
      {/* Chart View */}
      <div className="flex-1 relative bg-black/20 overflow-hidden">
        {/* Futuristic overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

        <canvas
          ref={chartRef}
          className={`w-full h-full touch-none ${
            chartLocked
              ? "cursor-not-allowed"
              : "cursor-grab active:cursor-grabbing"
          }`}
        />

        {/* Mobile-friendly Chart Controls - Only visible after simulation */}
        <AnimatePresence>
          {simulationComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-2 left-2 right-2 flex justify-between items-center z-20"
            >
              <div className="flex items-center gap-1 md:gap-2">
                <button
                  onClick={() => setChartLocked(!chartLocked)}
                  className={`p-1.5 rounded-full ${
                    chartLocked
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-teal-500/20 text-teal-400"
                  } backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors`}
                  title={chartLocked ? "Unlock chart" : "Lock chart"}
                >
                  {chartLocked ? (
                    <Lock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  ) : (
                    <Unlock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  )}
                </button>

                <button
                  onClick={() => setShowCrosshair(!showCrosshair)}
                  className={`p-1.5 rounded-full ${
                    showCrosshair
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "bg-black/40 text-zinc-400"
                  } backdrop-blur-md border border-white/10 hover:bg-black/40 transition-colors`}
                  title="Toggle crosshair"
                >
                  <Crosshair className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                <button
                  onClick={() => setShowControls(!showControls)}
                  className="p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors text-zinc-300"
                >
                  {showControls ? (
                    <ChevronUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  ) : (
                    <ChevronDown className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile-friendly Advanced Controls Panel */}
        <AnimatePresence>
          {showControls && simulationComplete && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-12 left-2 right-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-2 md:p-3 text-xs z-20"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">Chart Controls</h4>
                <button
                  onClick={() => setShowControls(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/30 rounded-lg p-2 border border-white/10">
                  <div className="text-zinc-400 mb-1">Zoom</div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleZoomOut}
                      className={`p-1.5 rounded-full bg-black/30 text-zinc-400 ${
                        chartLocked ? "opacity-50" : ""
                      }`}
                      disabled={chartLocked}
                    >
                      <ZoomOut className="h-3 w-3" />
                    </button>
                    <span className="text-zinc-300">
                      {zoomLevel.toFixed(1)}x
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className={`p-1.5 rounded-full bg-black/30 text-zinc-400 ${
                        chartLocked ? "opacity-50" : ""
                      }`}
                      disabled={chartLocked}
                    >
                      <ZoomIn className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 text-center">
                    Pinch or scroll to zoom
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-2 border border-white/10">
                  <div className="text-zinc-400 mb-1">View</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowAllTrades(!showAllTrades)}
                      className={`px-2 py-1 rounded text-xs flex-1 ${
                        showAllTrades
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-black/30 text-zinc-400"
                      }`}
                    >
                      {showAllTrades ? "Full" : "Default"}
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className={`px-2 py-1 rounded text-xs flex-1 bg-black/30 text-zinc-400 ${
                        chartLocked ? "opacity-50" : ""
                      }`}
                      disabled={chartLocked}
                    >
                      <RefreshCw className="h-3 w-3 inline mr-1" /> Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-400 mt-2 text-center">
                Swipe to pan • Double tap to reset view
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Timestamp Overlay */}
        {prices[safePlayIndex] && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 px-3 py-1 text-xs">
            <div className="text-zinc-300 font-mono">
              {new Date(prices[safePlayIndex][0]).toLocaleDateString()}{" "}
              {new Date(prices[safePlayIndex][0]).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}

        {/* Simulation Status Indicator */}
        <div
          className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs backdrop-blur-md border transition-all duration-300 ${
            playing
              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
              : simulationComplete
              ? "bg-teal-500/20 border-teal-500/40 text-teal-400"
              : "bg-amber-500/20 border-amber-500/40 text-amber-400"
          }`}
        >
          {playing
            ? "Simulation Running"
            : simulationComplete
            ? "Simulation Complete - Chart Unlocked"
            : "Simulation Paused"}
        </div>

        {/* Collapsible Help tooltip */}
        {showHelp ? (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md rounded-lg border border-white/20 p-3 text-xs max-w-[200px] z-10 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-1.5">
              <h4 className="font-medium text-white">Chart Controls</h4>
              <button
                onClick={() => setShowHelp(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="text-zinc-300 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="bg-indigo-400 h-2 w-2 rounded-full"></span>
                <span>Drag to pan chart (after simulation)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-teal-400 h-2 w-2 rounded-full"></span>
                <span>Green: Profitable trades</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-rose-400 h-2 w-2 rounded-full"></span>
                <span>Red: Losing trades</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-400 h-2 w-2 rounded-full"></span>
                <span>Yellow: Active trades</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-teal-400">▲</span>
                <span>Triangle up: Long trade</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-400">▼</span>
                <span>Triangle down: Short trade</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowHelp(true)}
            className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-zinc-300 hover:text-white p-1.5 rounded-full transition-colors z-10"
            title="Show chart help"
          >
            <Info className="h-4 w-4" />
          </button>
        )}

        {/* Hover tooltip */}
        {hoverInfo.visible && !playing && (
          <div
            className="absolute bg-black/80 backdrop-blur-md rounded-lg border border-white/20 p-2 text-xs z-20 pointer-events-none"
            style={{
              left: hoverInfo.x + 10,
              top: hoverInfo.y + 10,
              transform:
                hoverInfo.x > window.innerWidth / 2
                  ? "translateX(-100%)"
                  : "translateX(0)",
            }}
          >
            <div className="text-zinc-300 font-medium">{hoverInfo.date}</div>
            <div className="text-teal-400 font-mono">
              ${hoverInfo.price.toFixed(2)}
            </div>

            {hoverInfo.trade && (
              <div className="mt-1 pt-1 border-t border-white/10">
                <div className="flex items-center gap-1">
                  <span
                    className={
                      hoverInfo.trade.direction === "long"
                        ? "text-teal-400"
                        : "text-rose-400"
                    }
                  >
                    {hoverInfo.trade.direction === "long" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                  </span>
                  <span className="text-zinc-300">
                    {hoverInfo.trade.strategy}
                  </span>
                </div>
                <div
                  className={`${
                    hoverInfo.trade.profitPercent >= 0
                      ? "text-teal-400"
                      : "text-rose-400"
                  }`}
                >
                  {hoverInfo.trade.profitPercent.toFixed(2)}% P/L
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile-friendly Playback Controls */}
      <div className="bg-black/40 border-t border-white/10 p-2 md:p-3 sticky bottom-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={jumpToStart}
            className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-zinc-300 hover:text-white transition-colors"
            title="Jump to Start"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => setPlaying(!playing)}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-zinc-300 hover:text-white transition-colors"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={jumpToEnd}
            className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-zinc-300 hover:text-white transition-colors"
            title="Jump to End"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>

          <div className="flex-1 px-1 md:px-2">
            <input
              type="range"
              min={0}
              max={prices && prices.length > 0 ? prices.length - 1 : 0}
              value={safePlayIndex}
              onChange={(e) => setPlayIndex(Number(e.target.value))}
              className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:border-2 
                [&::-webkit-slider-thumb]:border-black/80"
            />
          </div>

          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1.5">
            <span className="text-xs text-zinc-400 hidden sm:inline">
              Speed:
            </span>
            <span className="text-xs text-zinc-400 sm:hidden">⚡</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-300 border-none focus:ring-0 appearance-none pl-1 pr-4"
              style={{ backgroundPosition: "right 0.2rem center" }}
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
            </select>
          </div>
        </div>

        {/* Active Trades - More compact for mobile */}
        <div className="flex flex-wrap gap-1 md:gap-2 mt-2">
          {activeTrades.length > 0
            ? activeTrades.map((trade, i) => (
                <div
                  key={i}
                  className={`bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs border ${
                    trade.direction === "long"
                      ? "border-teal-500/30 text-teal-400"
                      : "border-rose-500/30 text-rose-400"
                  } flex items-center gap-1 md:gap-2`}
                >
                  <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-amber-400"></span>
                  <span className="font-medium text-[10px] md:text-xs">
                    {trade.strategy.split(" ")[0]}
                  </span>
                  <span className="text-zinc-500 hidden md:inline">|</span>
                  <span className="text-[10px] md:text-xs">
                    {trade.direction.toUpperCase()}
                  </span>
                  <span className="text-zinc-500 hidden md:inline">|</span>
                  <span className="text-[10px] md:text-xs">
                    ${trade.entryPrice.toFixed(2)}
                  </span>
                </div>
              ))
            : prices.length > 0 &&
              !playing && (
                <div className="text-[10px] md:text-xs text-zinc-500 py-1">
                  No active trades
                </div>
              )}
        </div>

        {/* Chart instructions - more concise for mobile */}
        {!playing && completedTrades && completedTrades.length > 0 && (
          <div className="mt-2 text-[10px] md:text-xs text-zinc-500 text-center">
            {simulationComplete
              ? "Simulation complete - Swipe to pan, pinch to zoom"
              : "Tap play to continue simulation"}
          </div>
        )}
      </div>
    </>
  );
}
