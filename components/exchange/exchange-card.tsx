"use client";

import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import Image from "next/image";

interface Exchange {
  id: string;
  name: string;
  description: string;
  url: string;
  image?: string;
  trade_volume_24h_btc: number;
}

interface ExchangeCardProps {
  exchange: Exchange;
}

export default function ExchangeCard({ exchange }: ExchangeCardProps) {
  const router = useRouter();

  // Format volume with appropriate suffix
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M BTC`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K BTC`;
    }
    return `${volume.toFixed(2)} BTC`;
  };

  const openModal = () => {
    router.push(`/explore?id=${exchange.id}`, { scroll: false });
  };

  return (
    <button
      onClick={openModal}
      className="block group text-left focus:outline-none"
    >
      <div className="relative h-30 w-45 md:w-65 overflow-hidden rounded-2xl transition-all duration-300 group-hover:scale-[1.03] group-hover:translate-y-[-5px] shadow-[0_10px_20px_rgba(0,0,0,0.15)] group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.25)]">
        {/* Holographic effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-xl rounded-2xl border border-white/10 group-hover:border-teal-500/30 transition-colors duration-300"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/0 via-teal-500/0 to-indigo-500/0 group-hover:from-teal-500/10 group-hover:via-cyan-500/10 group-hover:to-indigo-500/10 rounded-[20px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>

        {/* Content */}
        <div className="relative h-full p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {exchange.image ? (
                <div className="relative h-12 w-12 rounded-full flex items-center justify-center overflow-hidden ">
                  <Image
                    src={exchange.image || "/placeholder.svg"}
                    alt={`${exchange.name} logo`}
                    className="w-full h-full object-cover"
                    height={12}
                    width={12}
                  />
                </div>
              ) : (
                <div className="relative h-8 w-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/10">
                  <TrendingUp className="h-4 w-4 text-teal-400" />
                </div>
              )}
              <h2 className="text-base font-medium text-zinc-100 truncate">
                {exchange.name}
              </h2>
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-center text-xs text-zinc-400 mt-1">
              <span>24h Volume</span>
              <span className="text-zinc-300">
                {formatVolume(exchange.trade_volume_24h_btc)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
