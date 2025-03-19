const COINGECKO_HISTORICAL_URL = (coinId: string) =>
  `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=90&interval=daily`;

async function fetchWithApiKey(url: string): Promise<Response> {
  const headers: HeadersInit = { accept: "application/json" };
  if (process.env.NEXT_PUBLIC_COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  }
  return fetch(url, { headers });
}

function calculatePriceChange(prices: number[][]): string {
  if (!prices || prices.length < 2) return "N/A";
  const oldest = prices[0][1];
  const latest = prices[prices.length - 1][1];
  return (((latest - oldest) / oldest) * 100).toFixed(2);
}

export async function fetchHistoricalData(coinId: string) {
  const response = await fetchWithApiKey(COINGECKO_HISTORICAL_URL(coinId));
  if (!response.ok)
    throw new Error(`Failed to fetch historical data for ${coinId}`);
  const data = await response.json();
  const prices = data.prices || [];
  if (prices.length < 2)
    return { prices: [], summary: "Insufficient historical data." };

  return {
    prices,
    summary: `90-day change: ${calculatePriceChange(prices)}%`,
  };
}
