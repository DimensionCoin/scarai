const INFLUENCERS = [
  "@WatcherGuru",
  "@CryptoWhale",
  "@elonmusk",
  "@APompliano",
  "@balajis",
  "@cz_binance",
  "@zerohedge",
  "@federalreserve",
  "@coinbureau",
  "@BloombergMarkets",
  "@ReutersBiz",
  "@CoinDesk",
  "@FinancialTimes",
  "@BTC_Archive",
  "@DavidSacks",
];

export interface GlobalNews {
  xInstructions?: string;
}

export function fetchGlobalNews(query: string): GlobalNews {
  return {
    xInstructions: `Search X posts from ${INFLUENCERS.join(
      ", "
    )} (last 7 days) for "${query}" insights.`,
  };
}
