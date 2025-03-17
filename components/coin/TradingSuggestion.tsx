"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import useTradingPrediction from "@/hooks/useTradingPrediction";

// Define props interface
interface TradingSuggestionProps {
  symbol: string; // Coin symbol passed from parent (e.g., "bitcoin")
}

const TradingSuggestion = ({ symbol }: TradingSuggestionProps) => {
  const { prediction, loading, error } = useTradingPrediction(symbol);
  const [showPulse, setShowPulse] = useState(true);

  // Pulse animation effect
  useEffect(() => {
    if (!loading && prediction) {
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, prediction]);

  // Loading state
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-xl rounded-xl"></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-xl"></div>
        <div className="relative p-4 border border-white/15 bg-black/10 backdrop-blur-xl rounded-xl">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
            <p className="text-zinc-300">
              Loading trading prediction for {symbol.toUpperCase()}...
            </p>
          </div>
        </div>
        <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[16px] blur-md opacity-30"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-xl rounded-xl"></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-xl"></div>
        <div className="relative p-4 border border-rose-500/20 bg-black/10 backdrop-blur-xl rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <p className="text-rose-400">Error: {error}</p>
          </div>
        </div>
        <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-red-500/20 rounded-[16px] blur-md opacity-30"></div>
      </div>
    );
  }

  // Success state (prediction available)
  if (prediction) {
    // Determine which prediction is stronger
    const longStronger = prediction.long > prediction.short;
    const shortStronger = prediction.short > prediction.long;
    const difference = Math.abs(prediction.long - prediction.short);

    // Determine signal strength based on difference
    let signalStrength = "Neutral";
    let signalColor = "text-zinc-400";
    let bgColor = "bg-zinc-500/10";
    let borderColor = "border-zinc-500/20";

    if (difference >= 30) {
      signalStrength = "Strong";
      if (longStronger) {
        signalColor = "text-teal-400";
        bgColor = "bg-teal-500/10";
        borderColor = "border-teal-500/20";
      } else {
        signalColor = "text-rose-400";
        bgColor = "bg-rose-500/10";
        borderColor = "border-rose-500/20";
      }
    } else if (difference >= 15) {
      signalStrength = "Moderate";
      if (longStronger) {
        signalColor = "text-teal-300";
        bgColor = "bg-teal-500/5";
        borderColor = "border-teal-500/15";
      } else {
        signalColor = "text-rose-300";
        bgColor = "bg-rose-500/5";
        borderColor = "border-rose-500/15";
      }
    } else if (difference >= 5) {
      signalStrength = "Weak";
      if (longStronger) {
        signalColor = "text-teal-200";
        bgColor = "bg-teal-500/5";
        borderColor = "border-teal-500/10";
      } else {
        signalColor = "text-rose-200";
        bgColor = "bg-rose-500/5";
        borderColor = "border-rose-500/10";
      }
    }

    return (
      <div className="relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-xl rounded-xl"></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-xl"></div>
        <div className="relative border border-white/15 bg-black/10 backdrop-blur-xl rounded-xl">
          {/* Header */}
          <div className="border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                {showPulse && (
                  <div className="absolute -inset-1 rounded-full bg-teal-400/30 animate-ping"></div>
                )}
                <Zap className="h-5 w-5 text-teal-400" />
              </div>
              <h3 className="text-sm font-medium text-zinc-200">
                AI Trading Signal
              </h3>
            </div>
            <div
              className={`px-2 py-1 rounded-full ${bgColor} ${borderColor} ${signalColor} text-xs font-medium`}
            >
              {signalStrength}{" "}
              {longStronger ? "Long" : shortStronger ? "Short" : "Signal"}
            </div>
          </div>

          {/* Main content */}
          <div className="p-4 space-y-4">
            {/* Prediction bars */}
            <div className="space-y-4">
              {/* LONG prediction */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-teal-400" />
                    <span className="text-sm font-medium text-zinc-300">
                      LONG
                    </span>
                  </div>
                  <span className="text-sm font-medium text-teal-400">
                    {prediction.long}% chance
                  </span>
                </div>
                <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-1000 ease-out"
                    style={{ width: `${prediction.long}%` }}
                  ></div>
                </div>
                {longStronger && difference >= 20 && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                    <Info className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zinc-300">
                      Strong long signal indicates potential upward price
                      movement. Consider a long position with appropriate risk
                      management.
                    </p>
                  </div>
                )}
              </div>

              {/* SHORT prediction */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                    <span className="text-sm font-medium text-zinc-300">
                      SHORT
                    </span>
                  </div>
                  <span className="text-sm font-medium text-rose-400">
                    {prediction.short}% chance
                  </span>
                </div>
                <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-1000 ease-out"
                    style={{ width: `${prediction.short}%` }}
                  ></div>
                </div>
                {shortStronger && difference >= 20 && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <Info className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zinc-300">
                      Strong short signal indicates potential downward price
                      movement. Consider a short position with appropriate risk
                      management.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-zinc-500 italic">
              This prediction is based on historical data and market analysis.
              Trading involves risk; always do your own research.
            </div>
          </div>

          {/* Footer with attribution */}
          <div className="px-4 py-2 border-t border-white/5 flex justify-between items-center">
            <p className="text-xs text-zinc-500">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
            <p className="text-xs text-zinc-500">
              Powered by GROK AI & CoinGecko
            </p>
          </div>
        </div>
        <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[16px] blur-md opacity-30"></div>
      </div>
    );
  }

  // Fallback (shouldn't occur due to hook logic, but included for completeness)
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-xl rounded-xl"></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-xl"></div>
      <div className="relative p-4 border border-white/15 bg-black/10 backdrop-blur-xl rounded-xl">
        <p className="text-zinc-400">
          No prediction available for {symbol.toUpperCase()}
        </p>
      </div>
      <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[16px] blur-md opacity-30"></div>
    </div>
  );
};

export default TradingSuggestion;
