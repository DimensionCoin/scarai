"use client";

import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import Image from "next/image";
import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";

interface TrendingToken {
  coin_id: string;
  name: string;
  symbol: string;
  image: { small: string };
  market_data: { price: number; price_change_percentage_24h: number };
}

const Trending = () => {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        const response = await fetch("/api/trending");
        const data = await response.json();
        setTrendingTokens(data);
      } catch (error) {
        console.error("Error fetching trending tokens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-xl mb-4">
      {/* Gradient border effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r  rounded-xl opacity-90 blur-sm"></div>

      <div className="relative gap-4 bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-teal-400" />
          <h2 className="text-sm font-medium text-zinc-300">Trending Now</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-400"></div>
            <span className="ml-2 text-sm text-zinc-400">
              Loading trending tokens...
            </span>
          </div>
        ) : (
          <Marquee
            gradient={false}
            speed={40}
            pauseOnHover={true}
            className="py-2 rounded-full"
          >
            {trendingTokens.map((token) => (
              <Link
                href={`/coin/${token.coin_id}`}
                key={token.coin_id}
                className="group"
              >
                <div className="flex items-center gap-3 bg-zinc-800/50 hover:bg-zinc-800/80 border border-zinc-700/30 hover:border-teal-500/30 px-4 py-2 rounded-lg mx-3 transition-all duration-300 hover:shadow-[0_0_15px_rgba(45,212,191,0.15)]">
                  <div className="relative">
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 opacity-0 group-hover:opacity-70 blur transition duration-300"></div>
                    <div className="relative">
                      <Image
                        src={token.image.small || "/placeholder.svg"}
                        alt={token.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    </div>
                  </div>

                  <span className="font-medium text-zinc-100 group-hover:text-teal-400 transition-colors">
                    {token.name}
                  </span>

                  <span className="text-zinc-400 text-xs uppercase">
                    {token.symbol.toUpperCase()}
                  </span>

                  <span className="font-medium text-zinc-100">
                    ${token.market_data.price.toFixed(2)}
                  </span>

                  <span
                    className={`flex items-center text-sm ${
                      token.market_data.price_change_percentage_24h >= 0
                        ? "text-teal-400"
                        : "text-rose-500"
                    }`}
                  >
                    {token.market_data.price_change_percentage_24h >= 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(
                      token.market_data.price_change_percentage_24h
                    ).toFixed(2)}
                    %
                  </span>
                </div>
              </Link>
            ))}
          </Marquee>
        )}
      </div>
    </div>
  );
};

export default Trending;
