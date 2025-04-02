"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart2,
  TrendingUp,
  BarChart,
  AlertCircle,
  Maximize2,
  X,
} from "lucide-react";
import BacktestControls from "./backtest-controls";
import BacktestResults from "./backtest-results";
import BacktestChart from "./backtest-chart";
import { useBacktestData } from "@/hooks/use-backtest-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile"; // Import the useMobile hook

export default function BacktestPlayground() {
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("chart");
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile(); // Use the mobile detection hook

  const {
    selectedCoin,
    selectedStrategies,
    amount,
    tradeDirection,
    prices,
    trades,
    summary,
    playIndex,
    setPlayIndex,
    playing,
    setPlaying,
    completedTrades,
    activeTrades,
    isLoading,
    runBacktest,
    currentPrice,
    currentDate,
    currentTime,
    totalProfit,
    winRate,
    playbackSpeed,
    setPlaybackSpeed,
    jumpToStart,
    jumpToEnd,
    error,
  } = useBacktestData();

  // Handle fullscreen mode
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && fullscreen) {
        setFullscreen(false);
      }
    };

    // Add event listener for ESC key to exit fullscreen
    document.addEventListener("keydown", handleEsc);

    // Handle body scroll locking when in fullscreen
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  // Add this function to handle running a new backtest
  const handleRunBacktest = (
    coinId?: string,
    strategies?: string[],
    direction?: "long" | "short" | "both"
  ) => {
    // Stop playback if it's running
    if (playing) {
      setPlaying(false);
    }

    // Use the provided direction or fall back to the current direction
    const directionToUse = direction || tradeDirection;
    console.log(`handleRunBacktest called with direction: ${directionToUse}`);

    // Run the backtest with the provided parameters
    return runBacktest(coinId, strategies, directionToUse);
  };

  // Check if backtest data is loaded
  const hasBacktestData = prices.length > 0;

  // Log the current trade direction and trades whenever they change
  useEffect(() => {
    console.log("Current trade direction:", tradeDirection);
    console.log(
      "Current trades:",
      trades.map((t) => t.direction)
    );
  }, [tradeDirection, trades]);

  return (
    <div
      ref={containerRef}
      className={`${
        fullscreen
          ? "fixed inset-0 z-50 w-screen h-screen bg-black/90 backdrop-blur-xl p-4 overflow-hidden "
          : "p-1"
      } ${!fullscreen && isMobile ? "pb-14" : "pb-10"}`} // Add bottom padding on mobile when not fullscreen
    >
      <div
        className={`bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden ${
          fullscreen ? "h-full flex flex-col" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-white/10 bg-black/10">
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
                <span>
                  {currentDate} {currentTime}
                </span>
              </div>
            )}
            <Button
              size="icon"
              onClick={() => setFullscreen(!fullscreen)}
              className="text-zinc-100 hover:text-zinc-200"
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fullscreen ? (
                <X className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 ${
            isMobile ? "" : "lg:grid-cols-4"
          } gap-0 ${fullscreen ? "flex-1 overflow-hidden" : ""}`}
        >
          {/* Left Sidebar - Controls */}
          <div
            className={`${
              isMobile ? "" : "lg:col-span-1"
            } border-r border-white/10 bg-black/10 p-2 ${
              fullscreen ? "overflow-y-auto" : ""
            }`}
          >
            <BacktestControls
              isLoading={isLoading}
              runBacktest={handleRunBacktest}
              playing={playing}
              setPlaying={setPlaying}
              hasBacktestData={hasBacktestData}
            />
          </div>

          {/* Main Content Area */}
          <div
            className={`${isMobile ? "" : "lg:col-span-3"} flex flex-col ${
              fullscreen ? "overflow-hidden" : ""
            }`}
          >
            {prices.length > 0 ? (
              <>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex-1 flex flex-col"
                >
                  <div className="border-b border-white/10 bg-black/20 px-4">
                    <TabsList className="bg-transparent border-b-0 overflow-x-auto">
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
                      <TabsTrigger
                        value="education"
                        className="data-[state=active]:bg-black/20 data-[state=active]:text-teal-400 data-[state=active]:shadow-none rounded-t-lg rounded-b-none border-b-2 data-[state=active]:border-teal-500 border-transparent"
                      >
                        Learn
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {activeTab === "chart" ? (
                    <TabsContent
                      value="chart"
                      className={`flex-1 flex flex-col p-0 m-0 ${
                        isMobile && !fullscreen ? "max-h-[80vh]" : ""
                      }`}
                    >
                      {/* Ensure chart and playback controls are fully visible on mobile */}
                      <BacktestChart
                        prices={prices}
                        trades={trades}
                        playIndex={playIndex}
                        setPlayIndex={setPlayIndex}
                        playing={playing}
                        setPlaying={setPlaying}
                        playbackSpeed={playbackSpeed}
                        setPlaybackSpeed={setPlaybackSpeed}
                        jumpToStart={jumpToStart}
                        jumpToEnd={jumpToEnd}
                        currentPrice={currentPrice}
                        totalProfit={totalProfit}
                        activeTrades={activeTrades}
                      />
                    </TabsContent>
                  ) : null}

                  <TabsContent
                    value="trades"
                    className={`flex-1 p-0 m-0 ${
                      fullscreen
                        ? "overflow-y-auto max-h-[calc(100vh-12rem)]"
                        : isMobile
                        ? "overflow-auto max-h-[70vh] mb-14"
                        : "overflow-auto"
                    }`}
                  >
                    <BacktestResults
                      view="trades"
                      activeTrades={activeTrades}
                      completedTrades={completedTrades}
                      currentPrice={currentPrice}
                    />
                  </TabsContent>

                  <TabsContent
                    value="results"
                    className={`flex-1 p-0 m-0 ${
                      fullscreen
                        ? "overflow-y-auto max-h-[calc(100vh-12rem)]"
                        : isMobile
                        ? "overflow-auto max-h-[70vh] mb-14"
                        : "overflow-auto"
                    }`}
                  >
                    <BacktestResults
                      view="results"
                      summary={summary}
                      totalProfit={totalProfit}
                      winRate={winRate}
                      completedTrades={completedTrades}
                      amount={amount}
                    />
                  </TabsContent>

                  <TabsContent
                    value="education"
                    className={`flex-1 p-0 m-0 ${
                      fullscreen
                        ? "overflow-y-auto max-h-[calc(100vh-12rem)]"
                        : isMobile
                        ? "overflow-auto max-h-[70vh] mb-14"
                        : "overflow-auto"
                    }`}
                  >
                    <BacktestResults
                      view="education"
                      selectedStrategies={selectedStrategies}
                      trades={trades}
                    />
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div
                className={`flex-1 flex items-center justify-center bg-black/20 ${
                  isMobile ? "mb-14" : ""
                }`}
              >
                <div className="text-center p-6 max-w-2xl">
                  <BarChart2 className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
                  <h2 className="text-xl font-medium text-zinc-400 mb-2">
                    Cryptocurrency Backtesting Platform
                  </h2>
                  <p className="text-zinc-500 mx-auto mb-6">
                    Test trading strategies against historical cryptocurrency
                    price data. Select a coin, choose your strategies, and
                    analyze performance metrics to refine your trading approach.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
                    <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                      <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
                        Available Strategies
                      </h3>
                      <ul className="text-xs text-zinc-400 space-y-1.5">
                        <li>• MACD Cross Strategy - Trend following</li>
                        <li>• RSI Reversal Strategy - Mean reversion</li>
                      </ul>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                      <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                        <BarChart className="h-3.5 w-3.5 text-teal-400" />
                        Performance Metrics
                      </h3>
                      <ul className="text-xs text-zinc-400 space-y-1.5">
                        <li>• Win rate and total return</li>
                        <li>• Trade-by-trade analysis</li>
                        <li>• Strategy comparison</li>
                        <li>• Exit reason statistics</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleRunBacktest()}
                      disabled={
                        !selectedCoin || !selectedStrategies.length || isLoading
                      }
                      className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500"
                    >
                      {isLoading ? "Running..." : "Run Backtest"}
                    </Button>
                  </div>
                  {error && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="font-medium">Error</span>
                      </div>
                      <p>{error}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
