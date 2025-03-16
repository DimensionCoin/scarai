"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUp,
  ArrowDown,
  Coins,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
        const response = await fetch("/api/top-coins", {
          next: { revalidate: 3600 },
        });
        if (!response.ok) throw new Error("Failed to fetch top coins");
        const result: CoinData = await response.json();
        setCoinData(result);
      } catch (error) {
        console.error("Error fetching coin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleViewMore = () => {
    setVisibleCount((prev) => (prev === 6 ? coinData.data.length : 6));
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-zinc-400">Loading coins...</p>
      </div>
    );
  }

  const { lastUpdated, data: topCoins } = coinData;

  // Calculate total market cap
  const totalMarketCap = topCoins.reduce(
    (total, coin) => total + coin.market_cap,
    0
  );

  // Format market cap for display
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  };

  return (
    <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg shadow-sm">
      <div className="p-3 border-b border-zinc-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-medium text-white">TOP COINS</h3>
        </div>
        <div className="text-xs text-zinc-400">
          {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "N/A"}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 p-3 text-xs font-medium text-zinc-400 border-b border-zinc-700/30">
        <div className="col-span-5">Asset</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-right">24h %</div>
        <div className="col-span-3 text-right">Market Cap</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-zinc-800/50">
        {topCoins.slice(0, visibleCount).map((coin) => (
          <Link href={`/coin/${coin.id}`} key={coin.id} className="block">
            <div className="grid grid-cols-12 gap-2 p-3 hover:bg-zinc-800/20 transition-colors">
              {/* Asset Column */}
              <div className="col-span-5 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-zinc-800/50 flex items-center justify-center overflow-hidden">
                  <Image
                    src={coin.image || "/default-coin.png"}
                    alt={`${coin.name} logo`}
                    width={16}
                    height={16}
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-zinc-100 truncate">
                    {coin.name}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {coin.symbol.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Price Column */}
              <div className="col-span-2 flex items-center justify-end">
                <p className="text-xs font-medium text-zinc-100">
                  $
                  {coin.current_price < 0.01
                    ? coin.current_price.toFixed(6)
                    : coin.current_price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </p>
              </div>

              {/* Price Change Column */}
              <div className="col-span-2 flex items-center justify-end">
                <div
                  className={`flex items-center justify-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${
                    coin.price_change_percentage_24h >= 0
                      ? "text-teal-400 bg-teal-500/10"
                      : "text-rose-400 bg-rose-500/10"
                  }`}
                >
                  {coin.price_change_percentage_24h >= 0 ? (
                    <ArrowUp className="h-2.5 w-2.5" />
                  ) : (
                    <ArrowDown className="h-2.5 w-2.5" />
                  )}
                  <span>
                    {Math.abs(coin.price_change_percentage_24h).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Market Cap Column */}
              <div className="col-span-3 flex flex-col items-end justify-center">
                <p className="text-xs text-zinc-100">
                  {formatMarketCap(coin.market_cap)}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {((coin.market_cap / totalMarketCap) * 100).toFixed(1)}% of
                  total
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {topCoins.length > 6 && (
        <div className="p-2 text-center border-t border-zinc-800/50">
          <button
            onClick={toggleViewMore}
            className="text-xs text-teal-400 hover:text-teal-300"
          >
            {visibleCount === 6 ? "View more" : "Show less"}
            {visibleCount === 6 ? (
              <ChevronDown className="h-3 w-3 inline ml-1" />
            ) : (
              <ChevronUp className="h-3 w-3 inline ml-1" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
