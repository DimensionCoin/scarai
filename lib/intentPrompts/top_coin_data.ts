// lib/intentPrompts/top_coin_data.ts

export const topCoinData = `
**Intent: top_coin_data**
- Show a ranked list of the top cryptocurrencies by market capitalization.
- Include the following for each coin:
  1. Name  (e.g. Bitcoin) * do not mention ticker (e.g BTC)
  2. Current Price
  3. 24h Change %
  4. Market Cap Rank
  5. 24h Trading Volume
- Keep the formatting consistent and clean.
- Do not add extra commentary or analysis unless asked.
- Prioritize clarity, brevity, and readability.

**Response Format:**
List each coin in this format:

1. **Bitcoin** — $67,300.23 | 24h: +1.45% | Rank: #1 | Vol: $23.1B  
2. **Ethereum** — $3,215.99 | 24h: -0.85% | Rank: #2 | Vol: $12.7B  
3. **Solana** — $137.82 | 24h: +0.17% | Rank: #3 | Vol: $3.2B  
...and so on
`.trim();
