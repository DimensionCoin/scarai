"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ExchangeCard from "@/components/exchange/exchange-card";
import ExchangeModal from "@/components/exchange/exchange-modal";

// Removed unused import: import { format } from "date-fns";

interface Exchange {
  id: string;
  name: string;
  description: string;
  url: string;
  image?: string;
  trust_score: number | null;
  trust_score_rank: number | null;
  trade_volume_24h_btc: number;
}

interface ExchangeData {
  data: Exchange[];
}

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Get the "id" query parameter
  const selectedId = searchParams.get("id") || undefined;

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const res = await fetch("/api/exchange", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch exchanges: ${res.status}`);
        }

        const { data }: ExchangeData = await res.json();
        setExchanges(data);
      } catch (error) {
        console.error("❌ Error fetching exchanges from API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchanges();
  }, []);

  const selectedExchange = selectedId
    ? exchanges.find((exchange) => exchange.id === selectedId)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen text-white p-4 text-center">
        <p className="text-zinc-400">Loading exchanges...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.05)_0%,transparent_70%)]"></div>
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-800/20 rounded-full blur-[80px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,20,20,0.1)_1px,transparent_1px),linear_gradient(to_bottom,rgba(20,20,20,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="container mx-auto p-4 relative z-10">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 text-center">
          Explore Crypto Exchanges
        </h1>

        {exchanges.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl max-w-md mx-auto">
            <div className="absolute inset-0 -z-10 bg-black/20 backdrop-blur-2xl rounded-3xl"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-30 rounded-3xl"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/10 backdrop-blur-xl p-8 text-center">
              <p className="text-zinc-400">No exchanges available</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exchanges.map((exchange) => (
              <ExchangeCard key={exchange.id} exchange={exchange} />
            ))}
          </div>
        )}
      </div>

      {selectedExchange && <ExchangeModal exchange={selectedExchange} />}
    </div>
  );
}
