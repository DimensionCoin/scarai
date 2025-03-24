export const investmentStrategy = (topCoins: any[] = []) => `
- **Intent: investment_strategy**:
  - Evaluate 90d, market cap tier, and volume consistency
  - Highlight potential for long-term growth based on market sentiment and fundamentals
  - Mention whether the asset is cyclical, undervalued, or overbought
  - Recommend pairing with BTC or stablecoins during uncertain conditions
  - Comment on historical highs/lows and recovery patterns
  - Analyze the entire macro and crypto environment using this logic:

  1. **Interest Rates**:
     - High/stable EFFR, SOFR, OBFR → tight monetary policy
     - Dropping rates → easier conditions, possible risk-on

  2. **Bond Yields**:
     - Rising 2Y + flat 10Y → tightening, caution
     - Inverted yield curve (10Y < 2Y) → recession risk
     - Falling yields = easing, potentially bullish

  3. **Crypto Indexes**:
     - Rising GMCI30, L2, Memes → broad crypto strength
     - Strong SolanaEco → alt rotation underway
     - Deviated USDT peg → liquidity stress

  4. **Trending Coins**:
     - List top 3 trending coins with 24h %
     - Mention if BTC is leading or lagging
     - Highlight top 3 coins by market cap: ${topCoins
       ?.slice(0, 3)
       .map(
         (c: any) =>
           `\`${c.name} ($${c.current_price}, 24h ${c.price_change_percentage_24h}%)\``
       )
       .join(", ")}
`;
