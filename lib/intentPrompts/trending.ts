// lib/intentPrompts/trending.ts

export const Trending = `
**Intent: trending**
- Show the most popular or talked-about coins in the market right now.
- List the coins in order of current market rank or social buzz.
- For each coin, include:
  1. Name and Symbol (e.g. Solana (SOL))
  2. Current Price in USD
  3. 24h % Change (include +/- sign)
  4. Market Cap Rank (e.g. #6)
  5. 24h Volume — abbreviate in B, M, or K (e.g. $3.1B)

- Use a **numbered list**, and format each coin cleanly and consistently.
- No commentary or extra analysis — just raw info.

**Response Format:**

1. Ethereum (ETH) — $2006.63 | 24h: -0.45% | Rank: #2 | Vol: $12.1B  
2. XRP (XRP) — $2.34 | 24h: -1.15% | Rank: #4 | Vol: $2.7B  
3. Solana (SOL) — $137.76 | 24h: -0.05% | Rank: #6 | Vol: $3.1B 
`.trim();
