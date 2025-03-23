import { useEffect, useRef, useState } from "react";

export interface PriceData {
  price: string;
  conf: string;
  expo: number;
  publish_time: number;
}

const normalizeId = (id: string) =>
  id.startsWith("0x") ? id.slice(2).toLowerCase() : id.toLowerCase();

export const usePythPrices = (feedIds: string[]) => {
  const [prices, setPrices] = useState<{ [key: string]: PriceData | null }>({});
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!feedIds || feedIds.length === 0) return;

    const fetchPrices = async () => {
      try {
        const query = feedIds
          .map((id) => `ids[]=${encodeURIComponent(id)}`)
          .join("&");
        const res = await fetch(`/api/pythprices?${query}`);
        if (!res.ok) throw new Error("Failed to fetch prices");
        const data = await res.json();

        const newPrices: { [key: string]: PriceData | null } = {};
        data.forEach((entry: any) => {
          newPrices[normalizeId(entry.id)] = entry.price;
        });

        setPrices(newPrices);
        setError(null);
      } catch (err) {
        console.error("Client fetch error:", err);
        setError(err as Error);
      }
    };

    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [feedIds.join(",")]);

  return { prices, error };
};
