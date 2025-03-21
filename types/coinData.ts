export interface CoinData {
  current: {
    price: string;
    change24h: string;
    volume: string;
    marketCap: string;
  };
  description: string;
  categories: string[];
  genesisDate: string | null;
  sentiment: { upPercentage: number; downPercentage: number };
  links: {
    homepage: string[];
    blockchainSites: string[];
    twitter: string;
    telegram: string;
    reddit: string;
    github: string[];
  };
  marketTrends: {
    ath: string;
    athDate: string;
    atl: string;
    atlDate: string;
    change7d: string;
    change14d: string;
    change30d: string;
    change90d?: string; // Added optional 90-day change
  };
  marketCapRank: number;
  tickers: Array<{
    base: string;
    target: string;
    marketName: string;
    lastPrice: number;
    volume: number;
    convertedLastUsd: number;
  }>;
  historical?: {
    prices: number[][];
    summary: string;
    technicals: {
      rsi: number | null;
      macd: { macd: number; signal: number; histogram: number } | null;
      sma: { sma20: number } | null;
    };
  };
  isTrending?: boolean;
}
