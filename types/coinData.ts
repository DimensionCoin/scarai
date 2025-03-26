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
  sentiment: {
    upPercentage: number;
    downPercentage: number;
  };
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
    change90d?: string;
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
    volumes?: number[][];
    summary: string;
    technical: {
      daily: IndicatorsResult;
      fourHour: IndicatorsResult;
    };
    extended?: {
      volatility: number | null;
      avgVolume: number | null;
    };
    supportResistance?: {
      resistanceLevels: number[];
      supportLevels: number[];
    };
  };
  isTrending?: boolean;
}

export type IndicatorsResult = {
  rsi: number | null;
  stochRsi: number | null;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    isRising: boolean;
    crossover: "bullish" | "bearish" | null;
  } | null;
  sma: {
    sma20: number;
    aboveSma: boolean;
  } | null;
  volumeSupport?: boolean;
  volatility: number | null;
  stochRsiFlip: "bullish" | "bearish" | null;
  confidence: "low" | "medium" | "high";
};
