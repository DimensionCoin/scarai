import { fetchPythPrices } from "@/utils/fetchPythPrices";
import { PYTH_PRICE_IDS } from "@/utils/pythPriceIds";
import { MarketSnapshot } from "@/types/MarketSnapshot";

export async function useMarketSnapshot(): Promise<MarketSnapshot> {
  const allIds = Object.values(PYTH_PRICE_IDS);
  const pythData = await fetchPythPrices(allIds);

  function getValue(key: keyof typeof PYTH_PRICE_IDS): number {
  const targetId = PYTH_PRICE_IDS[key].replace(/^0x/, "").toLowerCase();

  const item = pythData.find((d) => d.id.toLowerCase() === targetId);
  if (!item) {
    console.warn(`⚠️ No Pyth data found for: ${key} (${targetId})`);
    return 0;
  }

  return parseFloat(item.price.price) * 10 ** item.price.expo;
}

  return {
    timestamp: new Date().toISOString(),
    macro: {
      rates: {
        effr: getValue("EFFR"),
        sofr: getValue("SOFR"),
        bgcr: getValue("BGCR"), // if using
        tgcr: getValue("TGCR"), // if using
        obfr: getValue("OBFR"), // if using
      },
      yields: {
        us1m: getValue("US1M"),
        us1y: getValue("US1Y"),
        us2y: getValue("US2Y"),
        us10y: getValue("US10Y"),
        us30y: getValue("US30Y"),
        curveSpread: getValue("US10Y") - getValue("US2Y"),
        inverted: getValue("US10Y") < getValue("US2Y"),
      },
    },
    crypto: {
      gmci30: {
        value: getValue("GMCI30"),
        change24h: 0, // optional from Pyth if available
        change7d: 0,
      },
      layer2: {
        value: getValue("GML2"),
        change24h: 0,
        change7d: 0,
      },
      memes: {
        value: getValue("GMMEME"),
        change24h: 0,
        change7d: 0,
      },
      solanaEco: {
        value: getValue("GMSOL"),
        change24h: 0,
        change7d: 0,
      },
      stablecoins: {
        usdt: {
          peg: getValue("USDTB"),
          deviation: Math.abs(1 - getValue("USDTB")),
        },
      },
    },
  };
}
