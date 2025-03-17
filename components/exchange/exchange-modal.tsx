"use client";

import { useRouter } from "next/navigation";
import { X, TrendingUp, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import Image from "next/image";

interface Exchange {
  id: string;
  name: string;
  description: string;
  url: string;
  image?: string;
  trust_score_rank: number | null;
  trade_volume_24h_btc: number;
}

interface ExchangeModalProps {
  exchange: Exchange;
}

export default function ExchangeModal({ exchange }: ExchangeModalProps) {
  const router = useRouter();

  useEffect(() => {
    // Prevent scrolling when modal is open
    document.body.style.overflow = "hidden";

    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

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

  const closeModal = () => {
    router.push("/explore", { scroll: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={closeModal}
      ></div>

      {/* Modal content */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl">
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 -z-10 bg-black/40 backdrop-blur-2xl rounded-3xl"></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
        <div className="absolute inset-0 -z-10 border border-white/15 rounded-3xl"></div>

        {/* Glow effect */}
        <div className="absolute -inset-1 -z-20 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-30"></div>

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              {exchange.image ? (
                <div className="relative h-16 w-16 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/10">
                  <Image
                    src={exchange.image || "/placeholder.svg"}
                    alt={`${exchange.name} logo`}
                    className="w-full h-full object-cover"
                    height={12}
                    width={12}
                  />
                </div>
              ) : (
                <div className="relative h-16 w-16 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/10">
                  <TrendingUp className="h-8 w-8 text-teal-400" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-zinc-100">
                  {exchange.name}
                </h2>
                {exchange.trust_score_rank && (
                  <div className="text-sm px-2 py-0.5 bg-black/30 rounded-full border border-white/10 inline-block mt-1">
                    Rank #{exchange.trust_score_rank}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full bg-black/30 border border-white/10 hover:bg-black/50 transition-colors"
            >
              <X className="h-5 w-5 text-zinc-400" />
            </button>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Description
            </h3>
            <p className="text-zinc-300">
              {exchange.description || "No description available"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            
            <div className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">
                24h Trading Volume
              </h3>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-teal-400" />
                <span className="ml-2 text-xl font-semibold text-zinc-100">
                  {formatVolume(exchange.trade_volume_24h_btc)}
                </span>
              </div>
            </div>
          </div>

          {/* Visit button */}
          <a
            href={exchange.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-center font-medium text-white hover:from-teal-600 hover:to-indigo-600 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <span>Visit {exchange.name}</span>
              <ExternalLink className="h-4 w-4" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
