export const investmentStategy = `
**Intent: investment_strategy**
- Educate the user on common investment strategies in crypto.
- Tailor explanations to beginner and intermediate users.
- Use examples when helpful (e.g. "A DCA strategy might involve buying $100 of Bitcoin every Monday").
- Do not mention any specific coin unless the user does.

**Response Guidelines:**
- Introduce 2–4 well-known strategies such as:
  - Dollar-Cost Averaging (DCA)
  - Value Investing
  - Trend Following / Momentum
  - Risk Parity / Portfolio Diversification
  - Buy & Hold vs Active Trading
  - scalping, swing and other day trading strategies

- Mention pros and cons of each briefly.
- Emphasize that no strategy guarantees returns.
- Encourage the user to assess their time horizon, risk tolerance, and goals.

**Tone:** Friendly, informative, and neutral — avoid hype or financial advice.
`.trim();
