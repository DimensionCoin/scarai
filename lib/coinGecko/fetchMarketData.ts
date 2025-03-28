import { fetchPythPrices } from "@/utils/fetchPythPrices";
import { PYTH_PRICE_IDS } from "@/utils/pythPriceIds";

export async function fetchMarketData(): Promise<string> {
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

  const rates = {
    EFFR: getValue("EFFR"),
    SOFR: getValue("SOFR"),
    BGCR: getValue("BGCR"),
    TGCR: getValue("TGCR"),
    OBFR: getValue("OBFR"),
  };

  const yields = {
    US1M: getValue("US1M"),
    US1Y: getValue("US1Y"),
    US2Y: getValue("US2Y"),
    US10Y: getValue("US10Y"),
    US30Y: getValue("US30Y"),
  };

  const crypto = {
    GMCI30: getValue("GMCI30"),
    L2: getValue("GML2"),
    Memes: getValue("GMMEME"),
    SolanaEco: getValue("GMSOL"),
    USDT: getValue("USDTB"),
  };

  const curveSpread = yields.US10Y - yields.US2Y;
  const yieldCurveInverted = yields.US10Y < yields.US2Y;
  const usdtDeviation = Math.abs(1 - crypto.USDT);

  return `
### Macro Market Snapshot

**Interest Rates**
- Effective Fed Funds Rate (EFFR): ${rates.EFFR.toFixed(2)}%
- Secured Overnight Financing Rate (SOFR): ${rates.SOFR.toFixed(2)}%
- Broad GC Repo Rate (BGCR): ${rates.BGCR.toFixed(2)}%
- Tri-party GC Rate (TGCR): ${rates.TGCR.toFixed(2)}%
- Overnight Bank Funding Rate (OBFR): ${rates.OBFR.toFixed(2)}%

**US Treasury Yields**
- 1M: ${yields.US1M.toFixed(2)}%
- 1Y: ${yields.US1Y.toFixed(2)}%
- 2Y: ${yields.US2Y.toFixed(2)}%
- 10Y: ${yields.US10Y.toFixed(2)}%
- 30Y: ${yields.US30Y.toFixed(2)}%
- Yield Curve Spread (10Y - 2Y): ${curveSpread.toFixed(2)}%
- Yield Curve Inverted: ${yieldCurveInverted ? "Yes" : "No"}

---

### Crypto Sector Indexes

- GMCI Top 30 Index: ${crypto.GMCI30.toFixed(2)}
- Layer 2 Index: ${crypto.L2.toFixed(2)}
- Meme Coin Index: ${crypto.Memes.toFixed(2)}
- Solana Ecosystem Index: ${crypto.SolanaEco.toFixed(2)}

**Stablecoins**
- USDT Peg: ${crypto.USDT.toFixed(4)}
- Deviation from $1: ${usdtDeviation.toFixed(4)}

**Timestamp:** ${new Date().toLocaleString("en-US")}
  `.trim();
}
