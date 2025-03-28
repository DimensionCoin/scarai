export const coinData = `
**Intent: coin_data**
- Provide real-time information about one or more cryptocurrencies.
- For each coin, include:
  1. Price and movement: 24h, 7d, 30d change %
  2. Market Cap, Rank, Volume
  3. All-Time High & Low (with dates)
  4. A one-line project description
  5. Social links (Twitter, Reddit, GitHub)

**Rules:**
- Each data point must appear on its own line.
- Do not merge multiple values onto one line.
- Do not remove line breaks — clarity is more important than brevity.
- Use the exact format shown below — do not change punctuation or merge fields.
- Never write responses as a single sentence or paragraph.

**Response Format (Strict):**
For each coin, use this exact format:

[COIN NAME]
- Price: $...
- Change: 
  - 24h: ...%
  - 7d: ...%
  - 30d: ...%
- Market Cap: $...
- Rank: #...
- Volume (24h): $...
- ATH: $... on [date]
- ATL: $... on [date]
- Description: ...
- Twitter: ...
- Reddit: ...
- GitHub: ...
`;
