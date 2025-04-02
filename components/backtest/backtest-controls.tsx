"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  Settings,
  Layers,
  Info,
  X,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  DollarSign,
  Play,
  AlertCircle,
  Pause,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useBacktestData } from "@/hooks/use-backtest-data";
import type { StrategyInfo } from "@/types/backtest";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import the strategy names directly
const macdCrossStrategyName = "MACD Cross Strategy";
const rsiReversalStrategyName = "RSI Reversal Strategy";

const STRATEGIES: StrategyInfo[] = [
  {
    name: macdCrossStrategyName,
    description:
      "Uses MACD crossovers to identify trend changes and generate buy/sell signals",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "Trend",
    color: "teal",
    details:
      "The Moving Average Convergence Divergence (MACD) strategy identifies momentum changes by tracking the relationship between two moving averages of a price. When the MACD line crosses above the signal line, it generates a buy signal. When it crosses below, it generates a sell signal.",
    parameters: [
      {
        name: "Fast EMA",
        description: "Period for the fast exponential moving average",
        defaultValue: 12,
      },
      {
        name: "Slow EMA",
        description: "Period for the slow exponential moving average",
        defaultValue: 26,
      },
      {
        name: "Signal Line",
        description: "Period for the signal line",
        defaultValue: 9,
      },
      {
        name: "Stop Loss",
        description: "Percentage-based stop loss",
        defaultValue: "10%",
      },
    ],
  },
  {
    name: rsiReversalStrategyName,
    description:
      "Identifies overbought and oversold conditions using RSI to find potential reversals",
    icon: <Zap className="h-4 w-4" />,
    category: "Oscillator",
    color: "amber",
    details:
      "The Relative Strength Index (RSI) strategy identifies potential market reversals by measuring the speed and change of price movements. When RSI falls below 30, the market is considered oversold, generating a buy signal. When RSI rises above 70, the market is considered overbought, generating a sell signal.",
    parameters: [
      {
        name: "RSI Period",
        description: "Period for RSI calculation",
        defaultValue: 14,
      },
      {
        name: "Oversold Level",
        description: "RSI level to consider market oversold",
        defaultValue: 30,
      },
      {
        name: "Overbought Level",
        description: "RSI level to consider market overbought",
        defaultValue: 70,
      },
      {
        name: "Stop Loss",
        description: "Percentage-based stop loss",
        defaultValue: "5%",
      },
    ],
  },
];

type BacktestControlsProps = {
  isLoading: boolean;
  runBacktest: (
    coinId?: string,
    strategies?: string[],
    direction?: "long" | "short" | "both"
  ) => Promise<void>;
  playing?: boolean;
  setPlaying?: (playing: boolean) => void;
  hasBacktestData?: boolean;
};

export default function BacktestControls({
  isLoading,
  runBacktest,
  playing = false,
  setPlaying = () => {},
  hasBacktestData = false,
}: BacktestControlsProps) {
  const [showStrategyInfo, setShowStrategyInfo] = useState<string | null>(null);
  const infoPopupRef = useRef<HTMLDivElement>(null);
  // Keep a local state of the direction to avoid timing issues
  const [localDirection, setLocalDirection] = useState<
    "long" | "short" | "both"
  >("both");

  const {
    amount,
    setAmount,
    query,
    setQuery,
    coins,
    setCoins,
    selectedCoin,
    setSelectedCoin,
    selectedCoinName,
    setSelectedCoinName,
    selectedStrategies,
    setSelectedStrategies,
    tradeDirection,
    setTradeDirection,
    leverage,
    setLeverage,
    error,
    setError,
  } = useBacktestData();

  // Initialize local direction from global state
  useEffect(() => {
    setLocalDirection(tradeDirection);
  }, [tradeDirection]);

  // Ensure direction is preserved
  useEffect(() => {
    if (tradeDirection !== localDirection) {
      console.log(
        `Direction mismatch detected! Local: ${localDirection}, Global: ${tradeDirection}`
      );
      // Force the global state to match our local state
      setTradeDirection(localDirection);
    }
  }, [tradeDirection, localDirection, setTradeDirection]);

  // Function to handle direction change
  const handleDirectionChange = (newDirection: "long" | "short" | "both") => {
    console.log(`Setting direction from ${localDirection} to ${newDirection}`);

    // Update both local and global state
    setLocalDirection(newDirection);
    setTradeDirection(newDirection);

    // Force clear any existing trades when changing direction
    if (hasBacktestData) {
      console.log(
        `Direction changed to ${newDirection}, triggering new backtest`
      );

      // Add a small delay to ensure state is updated before running backtest
      setTimeout(() => {
        // Pass the direction explicitly to runBacktest
        runBacktest(undefined, undefined, newDirection);
      }, 100);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert
          variant="destructive"
          className="bg-rose-500/10 border-rose-500/30 text-rose-400"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
          <button
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-rose-400 hover:text-rose-300"
          >
            <X className="h-3 w-3" />
          </button>
        </Alert>
      )}

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
                onChange={(e) => {
                  const newQuery = e.target.value;
                  setQuery(newQuery);

                  // Show dropdown only when typing
                  if (newQuery.trim() !== "") {
                    // Fetch coins as user types
                    // The API call is handled in the useEffect in useBacktestData
                  }
                }}
                onBlur={() => {
                  // Hide dropdown when clicking outside
                  setTimeout(() => {
                    setCoins([]);
                  }, 200); // Small delay to allow click on dropdown item
                }}
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
                        setCoins([]); // Hide dropdown immediately after selection
                      }}
                    >
                      {coin.image && (
                        <div className="h-5 w-5 rounded-full bg-zinc-800/50 flex items-center justify-center overflow-hidden">
                          <Image
                            src={
                              coin.image ||
                              "/placeholder.svg?height=16&width=16" ||
                              "/placeholder.svg"
                            }
                            alt={coin.name}
                            width={16}
                            height={16}
                            className="h-4 w-4 object-contain"
                          />
                        </div>
                      )}
                      <div className="text-sm text-zinc-200">{coin.name}</div>
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

          {/* Trade Direction - HIGHLIGHTED SECTION */}
          <div className="border-2 border-amber-500/50 rounded-lg p-3 bg-amber-500/5">
            <label className="text-xs text-amber-400 font-bold mb-2 flex justify-between">
              <span>TRADE DIRECTION</span>
              <span className="text-[10px]">
                ONLY selected trades will be generated
              </span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {["long", "short", "both"].map((opt) => (
                <button
                  key={opt}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    localDirection === opt
                      ? opt === "long"
                        ? "bg-teal-500/20 text-teal-400 border-2 border-teal-500/50"
                        : opt === "short"
                        ? "bg-rose-500/20 text-rose-400 border-2 border-rose-500/50"
                        : "bg-indigo-500/20 text-indigo-400 border-2 border-indigo-500/50"
                      : "bg-black/20 text-zinc-400 border border-white/10 hover:bg-black/30"
                  }`}
                  onClick={() =>
                    handleDirectionChange(opt as "long" | "short" | "both")
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
            <div className="mt-2 p-2 bg-black/40 rounded border border-white/10">
              <p className="text-[10px] text-zinc-300 font-bold flex items-center">
                <AlertCircle className="h-3 w-3 text-amber-400 mr-1" />
                Current Mode:
                {localDirection === "long" ? (
                  <span className="ml-1 text-teal-400">LONG ONLY</span>
                ) : localDirection === "short" ? (
                  <span className="ml-1 text-rose-400">SHORT ONLY</span>
                ) : (
                  <span className="ml-1 text-indigo-400">BOTH DIRECTIONS</span>
                )}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                {localDirection === "long"
                  ? "Only long (buy) trades will be generated"
                  : localDirection === "short"
                  ? "Only short (sell) trades will be generated"
                  : "Both long and short trades will be generated"}
              </p>
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
          {STRATEGIES.map(({ name, description, icon, category, color }) => (
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
                        <span className={`text-${color}-400`}>{icon}</span>
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
                    <p className="text-xs text-zinc-400 mb-2">{description}</p>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full bg-${color}-500/10 text-${color}-400`}
                      >
                        {category}
                      </span>
                      <button
                        onClick={() => {
                          if (!selectedStrategies.includes(name)) {
                            setSelectedStrategies((prev) => [...prev, name]);
                          }
                          setShowStrategyInfo(null);
                        }}
                        className={`text-xs flex items-center gap-1 text-${color}-400 hover:text-${color}-300 transition-colors`}
                      >
                        {selectedStrategies.includes(name)
                          ? "Already selected"
                          : "Select strategy"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Run Button */}
      {/* Buttons */}
      <div className="flex flex-row gap-2">
        {/* Run/Play/Pause Button */}
        <Button
          onClick={(e) => {
            e.preventDefault();

            if (!hasBacktestData) {
              // If no backtest data, run a new backtest
              if (query && selectedStrategies.length > 0 && !isLoading) {
                // If we have a query but no selectedCoin, use the query as is
                if (!selectedCoin && query.trim()) {
                  console.log(
                    "Running backtest with manually entered coin:",
                    query
                  );
                  // The API will throw an error if the coin doesn't exist
                }

                console.log("Running backtest with direction:", localDirection);
                // Pass the local direction explicitly to runBacktest
                runBacktest(
                  selectedCoin || query.trim(),
                  selectedStrategies,
                  localDirection
                );
              } else {
                setError(
                  "Cannot run backtest: Please enter a coin name and select at least one strategy."
                );
              }
            } else {
              // If backtest data exists, toggle play/pause
              setPlaying(!playing);
            }
          }}
          disabled={
            (!hasBacktestData &&
              (!query.trim() || !selectedStrategies.length)) ||
            isLoading
          }
          className="flex-1 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white py-4"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
              Running...
            </div>
          ) : !hasBacktestData ? (
            <div className="flex items-center justify-center gap-2">
              <Play className="h-4 w-4" />
              Run Backtest
            </div>
          ) : playing ? (
            <div className="flex items-center justify-center gap-2">
              <Pause className="h-4 w-4" />
              Pause Backtest
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Play className="h-4 w-4" />
              Play Backtest
            </div>
          )}
        </Button>

        {/* Refresh Button */}
        <Button
          onClick={(e) => {
            e.preventDefault();

            // Stop playback if running
            if (playing) {
              setPlaying(false);
            }

            // Reset all component values to defaults
            setSelectedCoin("");
            setSelectedCoinName("");
            setSelectedStrategies([]);
            setAmount(1000);
            // Don't reset direction - keep the user's preference
            // setTradeDirection("both")
            setLeverage(1);
            setQuery("");
            setCoins([]);
            setError(null);

            // Force component refresh
            window.location.reload();
          }}
          className="w-10 h-10 p-0 bg-black/30 border border-white/10 hover:bg-black/40 text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
