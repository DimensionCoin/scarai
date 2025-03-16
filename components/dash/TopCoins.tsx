"use client";

import { useState, useEffect } from "react";
import { getTopCoins } from "@/actions/topcoins.actions";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUp,
  ArrowDown,
  Coins,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ICryptoPlain {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_7d?: number;
  createdAt: string;
  updatedAt: string;
}

interface CoinData {
  lastUpdated: string | null;
  data: ICryptoPlain[];
}

// No limit prop needed
export default function TopCoins() {
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [coinData, setCoinData] = useState<CoinData>({
    lastUpdated: null,
    data: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getTopCoins(); // Fetch all coins
        console.log("Raw getTopCoins result:", JSON.stringify(result, null, 2));
        setCoinData(result);
      } catch (error) {
        console.error("Error fetching coin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // No dependencies

  const toggleViewMore = () => {
    setVisibleCount((prev) => (prev === 6 ? coinData.data.length : 6));
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl h-64">
        <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-xl"></div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 opacity-70 blur animate-pulse"></div>
              <div className="relative bg-zinc-900 rounded-full p-3">
                <div className="h-6 w-6 rounded-full border-2 border-teal-400 border-t-transparent animate-spin"></div>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-400">Loading coins...</p>
          </div>
        </div>
      </div>
    );
  }

  const { lastUpdated, data: topCoins } = coinData;

  const totalMarketCap = topCoins.reduce(
    (total, coin) => total + coin.market_cap,
    0
  );

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl">
        <div className="relative z-10 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute -inset-1 bg-teal-400/20 rounded-full blur-sm"></div>
                <Coins className="h-5 w-5 text-teal-400 relative" />
              </div>
              <h3 className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
                TOP COINS
              </h3>
              <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></div>
            </div>
            <div className="text-xs text-zinc-400 font-mono flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></div>
              {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "N/A"}
            </div>
          </div>

          <div className="space-y-3">
            {topCoins.slice(0, visibleCount).map((coin) => (
              <Link href={`/coin/${coin.id}`} key={coin.id} className="block">
                <div className="relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl"></div>
                  <div className="relative p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="relative h-8 w-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/10">
                          <Image
                            src={coin.image || "/default-coin.png"}
                            alt={`${coin.name} logo`}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {coin.name}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono">
                          {coin.symbol.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-200">
                        $
                        {coin.current_price < 0.01
                          ? coin.current_price.toFixed(6)
                          : coin.current_price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        <div
                          className={`flex items-center text-xs ${
                            coin.price_change_percentage_24h >= 0
                              ? "text-teal-400"
                              : "text-rose-400"
                          }`}
                        >
                          {coin.price_change_percentage_24h >= 0 ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          <span>
                            {Math.abs(coin.price_change_percentage_24h).toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative h-2 w-full bg-black/20 cursor-pointer rounded-full mt-2 mb-1 overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-indigo-500"
                            style={{
                              width: `${Math.min(
                                100,
                                (coin.market_cap / totalMarketCap) * 100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-black/70 backdrop-blur-md border-white/10 text-xs"
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-mono">
                            ${(coin.market_cap / 1e9).toFixed(2)}B
                          </span>
                          <span className="text-zinc-400 text-[10px]">
                            (
                            {((coin.market_cap / totalMarketCap) * 100).toFixed(
                              1
                            )}
                            % of total)
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </Link>
            ))}
          </div>

          {topCoins.length > 6 && (
            <div className="mt-5 text-center relative">
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-32 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent"></div>
              <button
                onClick={toggleViewMore}
                className="relative inline-flex items-center gap-1 px-4 py-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:border-teal-500/30 group"
              >
                <span>{visibleCount === 6 ? "View more" : "Show less"}</span>
                {visibleCount === 6 ? (
                  <ChevronDown className="h-3 w-3 transition-transform group-hover:translate-y-0.5" />
                ) : (
                  <ChevronUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
                )}
                <div className="absolute -inset-0.5 bg-teal-400/10 rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-opacity"></div>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>
    </div>
  );
}
