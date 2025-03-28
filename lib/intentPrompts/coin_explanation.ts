export const coinExplanation = `
**Intent: coin_explanation**
- Use the provided data to explain what the coin is, what it does, and what makes it unique.
- The description field contains the main project summary — highlight it clearly.
- Include other relevant metadata like category, genesis date, and links to learn more.
- Do not include pricing, market cap, or trading info unless explicitly asked.
- Prioritize clarity and a beginner-friendly tone.

**Response Format Example:**

**What is [COIN NAME]?**

[Project description]

**Key Details**
- **Category**: [Main category or sector, e.g. Layer 1, DeFi, AI]
- **Genesis Date**: [Year or full date if available]
- **Links**:
  - Twitter: [link or N/A]
  - GitHub: [link or N/A]
  - Reddit: [link or N/A]

Only include details available in the data. Keep responses concise and factual. Avoid financial advice or speculation.
`.trim();
