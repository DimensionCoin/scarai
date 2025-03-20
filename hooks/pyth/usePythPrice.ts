"use client";
import { useState, useEffect } from "react";

export interface PriceData {
  price: string;
  conf: string;
  expo: number;
  publish_time: number;
}

const REST_BASE_URL = "https://hermes.pyth.network/api/latest_price_feeds";
const SSE_BASE_URL = "https://hermes.pyth.network/v2/updates/price/stream";

// Normalize an ID: remove "0x" prefix (if present) and convert to lowercase.
const normalizeId = (id: string) =>
  id.startsWith("0x") ? id.slice(2).toLowerCase() : id.toLowerCase();

/**
 * Hook that fetches price updates for multiple feed IDs.
 * @param feedIds Array of price feed IDs.
 * @returns An object mapping normalized feed IDs to PriceData.
 */
export const usePythPrices = (feedIds: string[]) => {
  const [prices, setPrices] = useState<{ [key: string]: PriceData | null }>({});
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!feedIds || feedIds.length === 0) return;

    const queryParams = feedIds
      .map((id) => `ids[]=${encodeURIComponent(id)}`)
      .join("&");

    // --- Initial REST fetch ---
    const restUrl = `${REST_BASE_URL}?${queryParams}`;
    fetch(restUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`REST fetch failed: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) {
          const newPrices: { [key: string]: PriceData | null } = {};
          data.forEach((feed: any) => {
            const normId = normalizeId(feed.id);
            newPrices[normId] = feed.price;
          });
          setPrices(newPrices);
        }
      })
      .catch((err) => {
        console.error("REST fetch error:", err);
        setError(err as Error);
      });

    // --- SSE connection for live updates ---
    const sseUrl = `${SSE_BASE_URL}?${queryParams}`;
    const es = new EventSource(sseUrl);

    es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.parsed && Array.isArray(data.parsed)) {
          setPrices((prev) => {
            const updated = { ...prev };
            data.parsed.forEach((feed: any) => {
              const normId = normalizeId(feed.id);
              updated[normId] = feed.price;
            });
            return updated;
          });
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    es.onerror = (err) => {
      console.error("SSE error:", err);
      setError(new Error("Error receiving price updates."));
      es.close();
    };

    return () => {
      es.close();
    };
  }, [feedIds]);

  return { prices, error };
};
