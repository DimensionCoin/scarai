"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { macdCrossStrategyName } from "@/lib/backtest/strategies/macdCrossStrategy";
import { rsiReversalStrategyName } from "@/lib/backtest/strategies/rsiReversalStrategy";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  Play,
  Pause,
  Search,
  Zap,
  BarChart,
  Settings,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  Maximize2,
  Minimize2,
  Info,
  X,
  ChevronsRight,
  ChevronsLeft,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";

const STRATEGIES = [
  {
    name: macdCrossStrategyName,
    description:
      "Uses MACD crossovers to identify trend changes and generate buy/sell signals",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "Trend",
    color: "teal",
  },
  {
    name: rsiReversalStrategyName,
    description:
      "Identifies overbought and oversold conditions using RSI to find potential reversals",
    icon: <Zap className="h-4 w-4" />,
    category: "Oscillator",
    color: "amber",
  },
];

type Trade = {
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  exitPrice: number;
  profitPercent: number;
  strategy: string;
};

type Summary = {
  strategyName: string;
  tradeCount: number;
  winRate: number;
  totalReturn: number;
  profit: number | string;
};

export default function BacktestPlayground() {
  const [amount, setAmount] = useState(1000);
  const [query, setQuery] = useState("");
  const [coins, setCoins] = useState<
    { id: string; name: string; symbol?: string; image?: string }[]
  >([]);
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [selectedCoinName, setSelectedCoinName] = useState<string>("");
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [tradeDirection, setTradeDirection] = useState<
    "long" | "short" | "both"
  >("both");
  const [leverage, setLeverage] = useState(1);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [prices, setPrices] = useState<number[][]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [playIndex, setPlayIndex] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [completedTrades, setCompletedTrades] = useState<Trade[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState("chart");
  const [showStrategyInfo, setShowStrategyInfo] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const infoPopupRef = useRef<HTMLDivElement>(null);

  // Calculate performance metrics
  const totalProfit = completedTrades.reduce(
    (sum, trade) => sum + trade.profitPercent,
    0
  );
  const winningTrades = completedTrades.filter((t) => t.profitPercent > 0);
  const winRate =
    completedTrades.length > 0
      ? (winningTrades.length / completedTrades.length) * 100
      : 0;

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.length > 1) {
        fetch(`/api/coinlist?query=${encodeURIComponent(query)}`)
          .then((res) => res.json())
          .then((data) => setCoins(data));
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playing) {
      interval = setInterval(() => {
        setPlayIndex((prev) => {
          const next = prev + 1;
          if (next >= prices.length) {
            setPlaying(false);
            return prev;
          }

          const newClosed = trades.filter(
            (t) => t.exitIndex === next && !completedTrades.includes(t)
          );

          if (newClosed.length > 0) {
            setCompletedTrades((prevTrades) => [...prevTrades, ...newClosed]);
          }

          return next;
        });
      }, 100 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [playing, prices, trades, completedTrades, playbackSpeed]);

  useEffect(() => {
    // Close strategy info popup when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        infoPopupRef.current &&
        !infoPopupRef.current.contains(event.target as Node)
      ) {
        setShowStrategyInfo(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

    if (prices.length === 0) return;

    // Calculate visible range (show last 100 candles or all if less)
    const visibleCount = Math.min(100, prices.length);
    const startIdx = Math.max(0, playIndex - visibleCount + 1);
    const endIdx = playIndex;

    const visiblePrices = prices.slice(startIdx, endIdx + 1);
    if (visiblePrices.length === 0) return;

    // Find min and max prices in visible range
    const priceValues = visiblePrices.map((p) => p[1]);
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
    if (visiblePrices.length > 0) {
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
    });

    // Draw active trade lines
    const activeTradesVisible = trades.filter(
      (t) => t.entryIndex <= endIdx && t.exitIndex > playIndex
    );

    activeTradesVisible.forEach((trade) => {
      const relativeEntryIndex = Math.max(0, trade.entryIndex - startIdx);
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
        ((prices[playIndex][1] - minPrice) / priceRange) * chartHeight;

      // Draw dashed line from entry to current
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(entryX, entryY);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
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
  }, [prices, playIndex, trades, completedTrades]);

  useEffect(() => {
    if (prices.length > 0 && chartRef.current) {
      drawChart();
    }
  }, [prices, playIndex, trades, completedTrades, drawChart]);

  const runBacktest = async () => {
    if (!selectedCoin || selectedStrategies.length === 0) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coin: selectedCoin,
          amount,
          strategies: selectedStrategies,
          direction: tradeDirection,
          leverage,
        }),
      });

      const data = await res.json();
      setSummary(data.summary);
      setPrices(data.prices);
      setTrades(data.trades);
      setCompletedTrades([]);
      setPlayIndex(0);
      setActiveTab("chart");
    } catch (error) {
      console.error("Error running backtest:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPrice = prices[playIndex]?.[1] ?? 0;
  const currentDate = prices[playIndex]
    ? new Date(prices[playIndex][0]).toLocaleDateString()
    : "";
  const currentTime = prices[playIndex]
    ? new Date(prices[playIndex][0]).toLocaleTimeString()
    : "";

  const activeTrades = trades.filter(
    (t) =>
      t.entryIndex <= playIndex &&
      t.exitIndex > playIndex &&
      !completedTrades.includes(t)
  );

  const jumpToStart = () => {
    setPlayIndex(0);
    setCompletedTrades([]);
  };

  const jumpToEnd = () => {
    setPlayIndex(prices.length - 1);
    // Calculate all completed trades
    const allCompletedTrades = trades.filter(
      (t) => t.exitIndex <= prices.length - 1
    );
    setCompletedTrades(allCompletedTrades);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div
      className={`p-4 ${
        fullscreen ? "fixed inset-0 z-50 bg-black/90 backdrop-blur-xl" : ""
      }`}
    >
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent">
              Quant Terminal
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {prices.length > 0 && (
              <div className="text-xs text-zinc-400 bg-black/30 px-2 py-1 rounded-full flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {currentDate} {currentTime}
                </span>
              </div>
            )}

            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 border-r border-white/10 bg-black/10 p-4">
            <div className="space-y-4">
              <div className="bg-black/20 rounded-lg border border-white/10 p-3">
                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5 text-teal-400" />
                  Configuration
                </h3>

                <div className="space-y-3">
                  {/* Investment Amount */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">
                      Investment Amount
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="bg-black/30 border-white/10 text-white pl-7 focus-visible:ring-teal-500 focus-visible:border-teal-500/50"
                      />
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                    </div>
                  </div>

                  {/* Coin Selection */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">
                      Select Cryptocurrency
                    </label>
                    <div className="relative">
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. solana, eth"
                        className="bg-black/30 border-white/10 text-white pl-7 focus-visible:ring-teal-500 focus-visible:border-teal-500/50"
                      />
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />

                      {coins.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 border border-white/10 rounded-lg bg-black/90 backdrop-blur-xl shadow-xl max-h-40 overflow-auto">
                          {coins.map((coin) => (
                            <div
                              key={coin.id}
                              className="px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-2"
                              onClick={() => {
                                setSelectedCoin(coin.id);
                                setSelectedCoinName(coin.name);
                                setQuery(coin.name);
                                setCoins([]);
                              }}
                            >
                              {coin.image && (
                                <div className="h-5 w-5 rounded-full bg-zinc-800/50 flex items-center justify-center overflow-hidden">
                                  <Image
                                    src={
                                      coin.image ||
                                      "/placeholder.svg?height=16&width=16"
                                    }
                                    alt={coin.name}
                                    width={16}
                                    height={16}
                                    className="h-4 w-4 object-contain"
                                  />
                                </div>
                              )}
                              <div className="text-sm text-zinc-200">
                                {coin.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedCoin && (
                      <div className="mt-2 px-2 py-1 bg-teal-500/10 border border-teal-500/20 rounded text-xs text-teal-400 inline-flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-teal-400"></div>
                        {selectedCoinName}
                      </div>
                    )}
                  </div>

                  {/* Trade Direction */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">
                      Trade Direction
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {["long", "short", "both"].map((opt) => (
                        <button
                          key={opt}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            tradeDirection === opt
                              ? opt === "long"
                                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                                : opt === "short"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                              : "bg-black/20 text-zinc-400 border border-white/10 hover:bg-black/30"
                          }`}
                          onClick={() =>
                            setTradeDirection(opt as "long" | "short" | "both")
                          }
                        >
                          {opt === "long" && (
                            <ArrowUpRight className="h-3 w-3 inline mr-1" />
                          )}
                          {opt === "short" && (
                            <ArrowDownRight className="h-3 w-3 inline mr-1" />
                          )}
                          {opt === "both" && (
                            <RefreshCw className="h-3 w-3 inline mr-1" />
                          )}
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Leverage */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 flex justify-between">
                      <span>Leverage</span>
                      <span className="text-teal-400">{leverage}x</span>
                    </label>
                    <Slider
                      value={[leverage]}
                      min={1}
                      max={25}
                      step={1}
                      onValueChange={(value) => setLeverage(value[0])}
                      className="py-1"
                    />
                  </div>
                </div>
              </div>

              {/* Strategy Selection */}
              <div className="bg-black/20 rounded-lg border border-white/10 p-3">
                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-teal-400" />
                  Trading Strategies
                </h3>

                <div className="space-y-2">
                  {STRATEGIES.map(
                    ({ name, description, icon, category, color }) => (
                      <div
                        key={name}
                        className={`relative rounded-lg border transition-colors cursor-pointer ${
                          selectedStrategies.includes(name)
                            ? `bg-${color}-500/10 border-${color}-500/30`
                            : "bg-black/20 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div
                          className="p-2.5"
                          onClick={() => {
                            setSelectedStrategies((prev) =>
                              prev.includes(name)
                                ? prev.filter((s) => s !== name)
                                : [...prev, name]
                            );
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={selectedStrategies.includes(name)}
                              className={
                                selectedStrategies.includes(name)
                                  ? `text-${color}-500`
                                  : ""
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`${
                                      selectedStrategies.includes(name)
                                        ? `text-${color}-400`
                                        : "text-zinc-300"
                                    }`}
                                  >
                                    {icon}
                                  </span>
                                  <span className="font-medium text-zinc-200 text-xs">
                                    {name}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowStrategyInfo(
                                      showStrategyInfo === name ? null : name
                                    );
                                  }}
                                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                  <Info className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Strategy Info Popup */}
                        <AnimatePresence>
                          {showStrategyInfo === name && (
                            <motion.div
                              ref={infoPopupRef}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className={`absolute z-40 top-full mt-1 left-0 right-0 bg-black/90 backdrop-blur-xl border border-${color}-500/20 rounded-lg p-3 shadow-xl`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-${color}-400`}>
                                    {icon}
                                  </span>
                                  <h3 className="font-medium text-zinc-200 text-xs">
                                    {name}
                                  </h3>
                                </div>
                                <button
                                  onClick={() => setShowStrategyInfo(null)}
                                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="text-xs text-zinc-400 mb-2">
                                {description}
                              </p>
                              <div className="flex justify-between items-center">
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded-full bg-${color}-500/10 text-${color}-400`}
                                >
                                  {category}
                                </span>
                                <button
                                  onClick={() => {
                                    if (!selectedStrategies.includes(name)) {
                                      setSelectedStrategies((prev) => [
                                        ...prev,
                                        name,
                                      ]);
                                    }
                                    setShowStrategyInfo(null);
                                  }}
                                  className={`text-xs flex items-center gap-1 text-${color}-400 hover:text-${color}-300 transition-colors`}
                                >
                                  {selectedStrategies.includes(name)
                                    ? "Already selected"
                                    : "Select strategy"}
                                  {!selectedStrategies.includes(name) && (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Run Button */}
              <Button
                onClick={runBacktest}
                disabled={
                  !selectedCoin || !selectedStrategies.length || isLoading
                }
                className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white py-5"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    Running Backtest...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Run Backtest
                    <Play className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 flex flex-col">
            {prices.length > 0 ? (
              <>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex-1 flex flex-col"
                >
                  <div className="border-b border-white/10 bg-black/20 px-4">
                    <TabsList className="bg-transparent border-b-0">
                      <TabsTrigger
                        value="chart"
                        className="data-[state=active]:bg-black/20 data-[state=active]:text-teal-400 data-[state=active]:shadow-none rounded-t-lg rounded-b-none border-b-2 data-[state=active]:border-teal-500 border-transparent"
                      >
                        Chart
                      </TabsTrigger>
                      <TabsTrigger
                        value="trades"
                        className="data-[state=active]:bg-black/20 data-[state=active]:text-teal-400 data-[state=active]:shadow-none rounded-t-lg rounded-b-none border-b-2 data-[state=active]:border-teal-500 border-transparent"
                      >
                        Trades
                      </TabsTrigger>
                      <TabsTrigger
                        value="results"
                        className="data-[state=active]:bg-black/20 data-[state=active]:text-teal-400 data-[state=active]:shadow-none rounded-t-lg rounded-b-none border-b-2 data-[state=active]:border-teal-500 border-transparent"
                      >
                        Results
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="chart"
                    className="flex-1 flex flex-col p-0 m-0"
                  >
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
                              totalProfit >= 0
                                ? "text-teal-400"
                                : "text-rose-400"
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
                            max={prices.length - 1}
                            value={playIndex}
                            onChange={(e) =>
                              setPlayIndex(Number(e.target.value))
                            }
                            className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-black/40 rounded px-2 py-1">
                          <span className="text-xs text-zinc-400">Speed:</span>
                          <select
                            value={playbackSpeed}
                            onChange={(e) =>
                              setPlaybackSpeed(Number(e.target.value))
                            }
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
                            <span className="text-zinc-300">
                              {trade.strategy}
                            </span>
                            <span className="text-zinc-500">|</span>
                            <span className="text-zinc-400">
                              Entry: ${trade.entryPrice.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="trades"
                    className="flex-1 p-0 m-0 overflow-auto"
                  >
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
                                      <span className="text-zinc-500">
                                        Entry:
                                      </span>{" "}
                                      <span className="text-zinc-300">
                                        ${trade.entryPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500">
                                        Target:
                                      </span>{" "}
                                      <span className="text-zinc-300">
                                        ${trade.exitPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500">
                                        Current:
                                      </span>{" "}
                                      <span className="text-zinc-300">
                                        ${currentPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500">
                                        P/L:
                                      </span>{" "}
                                      <span
                                        className={`${
                                          currentPrice - trade.entryPrice >= 0
                                            ? "text-teal-400"
                                            : "text-rose-400"
                                        }`}
                                      >
                                        {(
                                          ((currentPrice - trade.entryPrice) /
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
                                  } p-2 text-xs`}
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
                                      <span className="text-zinc-500">
                                        Entry:
                                      </span>{" "}
                                      <span className="text-zinc-300">
                                        ${trade.entryPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500">
                                        Exit:
                                      </span>{" "}
                                      <span className="text-zinc-300">
                                        ${trade.exitPrice.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
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
                  </TabsContent>

                  <TabsContent
                    value="results"
                    className="flex-1 p-0 m-0 overflow-auto"
                  >
                    <div className="p-4">
                      {summary.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Overall Performance */}
                          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 p-3">
                            <h3 className="text-sm font-medium text-zinc-300 mb-3">
                              Overall Performance
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-black/30 rounded-lg border border-white/10 p-2">
                                <div className="text-xs text-zinc-500 mb-1">
                                  Total Return
                                </div>
                                <div
                                  className={`text-lg font-medium ${
                                    totalProfit >= 0
                                      ? "text-teal-400"
                                      : "text-rose-400"
                                  }`}
                                >
                                  {totalProfit.toFixed(2)}%
                                </div>
                              </div>

                              <div className="bg-black/30 rounded-lg border border-white/10 p-2">
                                <div className="text-xs text-zinc-500 mb-1">
                                  Win Rate
                                </div>
                                <div className="text-lg font-medium text-teal-400">
                                  {winRate.toFixed(1)}%
                                </div>
                              </div>

                              <div className="bg-black/30 rounded-lg border border-white/10 p-2">
                                <div className="text-xs text-zinc-500 mb-1">
                                  Total Trades
                                </div>
                                <div className="text-lg font-medium text-zinc-300">
                                  {completedTrades.length}
                                </div>
                              </div>

                              <div className="bg-black/30 rounded-lg border border-white/10 p-2">
                                <div className="text-xs text-zinc-500 mb-1">
                                  Profit
                                </div>
                                <div
                                  className={`text-lg font-medium ${
                                    totalProfit >= 0
                                      ? "text-teal-400"
                                      : "text-rose-400"
                                  }`}
                                >
                                  {formatCurrency(amount * (totalProfit / 100))}
                                </div>
                              </div>
                            </div>
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
                                      {s.totalReturn.toFixed(2)}%
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <span className="text-zinc-500">
                                        Trades:
                                      </span>{" "}
                                      <span className="text-zinc-300">
                                        {s.tradeCount}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500">
                                        Win Rate:
                                      </span>{" "}
                                      <span className="text-zinc-300">
                                        {s.winRate.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500">
                                        Profit:
                                      </span>{" "}
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
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-zinc-500">
                          <BarChart2 className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                          <p>Run a backtest to see results</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-black/20">
                <div className="text-center p-6">
                  <BarChart2 className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
                  <h2 className="text-xl font-medium text-zinc-400 mb-2">
                    Backtest Playground
                  </h2>
                  <p className="text-zinc-500 max-w-md mx-auto mb-4">
                    Configure your backtest parameters and select strategies to
                    analyze historical performance.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      onClick={runBacktest}
                      disabled={
                        !selectedCoin || !selectedStrategies.length || isLoading
                      }
                      className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500"
                    >
                      {isLoading ? "Running..." : "Run Backtest"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
