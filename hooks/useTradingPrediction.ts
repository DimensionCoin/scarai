// hooks/useTradingPrediction.ts
import { useState, useEffect } from "react";

// Define the prediction type (matches API)
interface TradingPrediction {
  long: number;
  short: number;
}

// Hook return type
interface TradingPredictionResult {
  prediction: TradingPrediction | null;
  loading: boolean;
  error: string | null;
}

const useTradingPrediction = (symbol: string): TradingPredictionResult => {
  const [prediction, setPrediction] = useState<TradingPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setError("Symbol is required");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/trading-prediction?symbol=${encodeURIComponent(symbol)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal, // For cancellation
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            response.status === 400
              ? `Invalid request: ${errorText}`
              : response.status === 500
              ? `Server error: ${errorText}`
              : `HTTP error ${response.status}: ${errorText}`
          );
        }

        const data: TradingPrediction = await response.json();
        setPrediction(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore abort errors
        }
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();

    // Cleanup: Abort fetch on unmount or symbol change
    return () => {
      controller.abort();
    };
  }, [symbol]);

  return { prediction, loading, error };
};

export default useTradingPrediction;
