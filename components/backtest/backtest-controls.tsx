"use client";

import type React from "react";

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

// Import the breakout strategy name
const macdCrossStrategyName = "MACD Cross Strategy";
const rsiReversalStrategyName = "RSI Reversal Strategy";
const breakoutStrategyName = "Breakout Strategy";

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
  {
    name: breakoutStrategyName,
    description:
      "Identifies price breakouts from recent ranges with MACD momentum confirmation",
    icon: <TrendingUp className="h-4 w-4" />,
    category: "Momentum",
    color: "indigo",
    details:
      "The Breakout Strategy identifies when price breaks out of its recent trading range, entering long positions when price breaks above resistance with positive MACD momentum, and short positions when price breaks below support with negative MACD momentum.",
    parameters: [
      {
        name: "Lookback Period",
        description: "Period for calculating recent highs and lows",
        defaultValue: 20,
      },
      {
        name: "Breakout Threshold",
        description: "Percentage threshold for confirming breakouts",
        defaultValue: "0.2%",
      },
      {
        name: "Stop Loss",
        description: "Percentage-based stop loss",
        defaultValue: "10%",
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
  setAmount: (amount: number) => void;
  currentAmount: number;
  currentLeverage?: number; // Add this prop
  setLeverage?: (leverage: number) => void; // Add this prop
};

export default function BacktestControls({
  isLoading,
  runBacktest,
  playing = false,
  setPlaying = () => {},
  hasBacktestData = false,
  setAmount,
  currentAmount,
  currentLeverage = 1, // Default to 1 if not provided
  setLeverage = () => {}, // Default to no-op if not provided
}: BacktestControlsProps) {
  const [showStrategyInfo, setShowStrategyInfo] = useState<string | null>(null);
  const infoPopupRef = useRef<HTMLDivElement>(null);
  // Keep a local state of the direction to avoid timing issues
  const [localDirection, setLocalDirection] = useState<
    "long" | "short" | "both"
  >("both");
  // Keep a local state of the leverage to avoid timing issues
  const [localLeverage, setLocalLeverage] = useState<number>(currentLeverage);
  // Add a state to track if a coin has been selected
  const [coinSelected, setCoinSelected] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
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
    error,
    setError,
  } = useBacktestData();

  // Initialize local direction from global state
  useEffect(() => {
    setLocalDirection(tradeDirection);
  }, [tradeDirection]);

  // Initialize local leverage from props
  useEffect(() => {
    setLocalLeverage(currentLeverage);
  }, [currentLeverage]);

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

  // Function to handle leverage change
  const handleLeverageChange = (newLeverage: number) => {
    console.log(`Setting leverage from ${localLeverage} to ${newLeverage}x`);

    // Update both local and global state
    setLocalLeverage(newLeverage);
    setLeverage(newLeverage);
  };

  // Helper function to get dynamic class names based on strategy selection
  // const getStrategyClasses = (name: string, color: string) => {
  //   if (selectedStrategies.includes(name)) {
  //     return `bg-${color}-500/10 border-${color}-500/30`
  //   }
  //   return "bg-black/20 border-white/10 hover:border-white/20"
  // }

  // // Helper function to get dynamic text color based on strategy selection
  // const getStrategyTextColor = (name: string, color: string) => {
  //   if (selectedStrategies.includes(name)) {
  //     return `text-${color}-400`
  //   }
  //   return "text-zinc-300"
  // }

  // Function to handle coin selection
  const handleCoinSelection = (coin: { id: string; name: string }) => {
    setSelectedCoin(coin.id);
    setSelectedCoinName(coin.name);
    setQuery(coin.name);
    setCoins([]); // Hide dropdown immediately after selection
    setCoinSelected(true); // Mark that a coin has been selected

    // Blur the input to remove focus
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // If the user is clearing the input or typing something different than the selected coin,
    // reset the selected coin and allow searching again
    if (
      newQuery.trim() === "" ||
      (selectedCoinName && !newQuery.includes(selectedCoinName))
    ) {
      setSelectedCoin("");
      setSelectedCoinName("");
      setCoinSelected(false);
    }

    // Only fetch coins if we don't have a selection yet or if the user is explicitly changing their selection
    if (!coinSelected && newQuery.trim() !== "") {
      // The API call is handled in the useEffect in useBacktestData
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
                value={currentAmount}
                onChange={(e) => {
                  const newAmount = Number(e.target.value);
                  if (!isNaN(newAmount) && newAmount > 0) {
                    console.log(`Setting amount to: $${newAmount}`);
                    setAmount(newAmount);
                  }
                }}
                onBlur={(e) => {
                  // Additional validation on blur
                  const newAmount = Number(e.target.value);
                  if (!isNaN(newAmount) && newAmount > 0) {
                    console.log(`Confirmed amount: $${newAmount}`);
                  }
                }}
                min="1"
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
                ref={inputRef}
                value={query}
                onChange={handleInputChange}
                onFocus={() => {
                  // If a coin is already selected, don't show the dropdown
                  if (coinSelected) {
                    setCoins([]);
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

              {coins.length > 0 && !coinSelected && (
                <div className="absolute z-50 left-0 right-0 mt-1 border border-white/10 rounded-lg bg-black/90 backdrop-blur-xl shadow-xl max-h-40 overflow-auto">
                  {coins.map((coin) => (
                    <div
                      key={coin.id}
                      className="px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-2"
                      onClick={() => handleCoinSelection(coin)}
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

          {/* Trade Direction */}
          <div className="rounded-lg p-3 bg-black/20">
            <label className="text-xs text-zinc-300 font-medium mb-2 block">
              Trade Direction
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
          </div>

          {/* Leverage */}
          <div className="rounded-lg p-3 bg-black/20">
            <label className="text-xs text-zinc-300 font-medium mb-2 block">
              Leverage
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">1x</span>
              <Slider
                value={[localLeverage]}
                min={1}
                max={25}
                step={1}
                onValueChange={(value) => {
                  console.log(`Setting leverage to: ${value[0]}x`);
                  handleLeverageChange(value[0]);
                }}
                className="flex-1"
              />
              <span className="text-xs text-zinc-400">25x</span>
            </div>
            <div className="mt-2 text-center">
              <span className="text-lg font-bold text-indigo-400">
                {localLeverage}x
              </span>
            </div>
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
                  ? color === "teal"
                    ? "bg-teal-500/10 border-teal-500/30"
                    : color === "amber"
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-indigo-500/10 border-indigo-500/30"
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
                        ? color === "teal"
                          ? "text-teal-500"
                          : color === "amber"
                          ? "text-amber-500"
                          : "text-indigo-500"
                        : ""
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            selectedStrategies.includes(name)
                              ? color === "teal"
                                ? "text-teal-400"
                                : color === "amber"
                                ? "text-amber-400"
                                : "text-indigo-400"
                              : "text-zinc-300"
                          }
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
                    className={`absolute z-40 top-full mt-1 left-0 right-0 bg-black/90 backdrop-blur-xl border ${
                      color === "teal"
                        ? "border-teal-500/20"
                        : color === "amber"
                        ? "border-amber-500/20"
                        : "border-indigo-500/20"
                    } rounded-lg p-3 shadow-xl`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={
                            color === "teal"
                              ? "text-teal-400"
                              : color === "amber"
                              ? "text-amber-400"
                              : "text-indigo-400"
                          }
                        >
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
                    <p className="text-xs text-zinc-400 mb-2">{description}</p>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          color === "teal"
                            ? "bg-teal-500/10 text-teal-400"
                            : color === "amber"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-indigo-500/10 text-indigo-400"
                        }`}
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
                        className={`text-xs flex items-center gap-1 ${
                          color === "teal"
                            ? "text-teal-400 hover:text-teal-300"
                            : color === "amber"
                            ? "text-amber-400 hover:text-amber-300"
                            : "text-indigo-400 hover:text-indigo-300"
                        } transition-colors`}
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
                console.log("Running backtest with amount:", currentAmount);
                console.log("Running backtest with leverage:", localLeverage);
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
            setLocalLeverage(1);
            setQuery("");
            setCoins([]);
            setError(null);
            setCoinSelected(false); // Reset coin selection state

            // Force a complete reset of the application state
            // This will reload the page, which is the most reliable way to reset everything
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
