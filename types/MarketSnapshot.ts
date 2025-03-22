// /types/MarketSnapshot.ts

export interface MarketSnapshot {
  timestamp: string;

  macro: {
    rates: {
      effr: number;
      sofr: number;
      obfr: number;
      bgcr: number;
      tgcr: number;
    };
    yields: {
      us1m: number;
      us1y: number;
      us2y: number;
      us10y: number;
      us30y: number;
      curveSpread: number;
      inverted: boolean;
    };
  };

  crypto: {
    gmci30: {
      value: number;
      change24h: number;
      change7d: number;
    };
    layer2: {
      value: number;
      change24h: number;
      change7d: number;
    };
    memes: {
      value: number;
      change24h: number;
      change7d: number;
    };
    solanaEco: {
      value: number;
      change24h: number;
      change7d: number;
    };
    stablecoins: {
      usdt: {
        peg: number;
        deviation: number;
      };
    };
  };
}
