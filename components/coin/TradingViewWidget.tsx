import React, { useEffect, useRef, memo } from "react";

interface TradingViewWidgetProps {
  symbol: string; // Expected to be either "BTC" or, e.g., "BINANCE:BTCUSD"
}

function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!symbol) return;

    // If the symbol already contains a colon, assume it includes the market.
    // Otherwise, default to Coinbase.
    const tradingSymbol = symbol.includes(":")
      ? symbol
      : `COINBASE:${symbol.toUpperCase()}USD`;

      console.log(`user is fetching for the symbol and market of ${tradingSymbol}`)

    // Log the full TradingView symbol and, if available, log its parts.
    if (tradingSymbol.includes(":")) {
      const [market, baseSymbol] = tradingSymbol.split(":");
      console.log("TradingView Market:", market);
      console.log("TradingView Base Symbol:", baseSymbol);
    } else {
      console.log("Using default market: COINBASE");
      console.log("TradingView Symbol:", tradingSymbol);
    }

    // Clear existing content to prevent duplicates
    if (container.current) {
      container.current.innerHTML = "";
      const widgetDiv = document.createElement("div");
      widgetDiv.className = "tradingview-widget-container__widget";
      container.current.appendChild(widgetDiv);
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: tradingSymbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "1M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "http://localhost:3001/coin/[id]/chart", // Adjust if needed
      chartOnly: true,
      noTimeScale: false,
    });

    if (container.current) {
      container.current.appendChild(script);
    }

    return () => {
      if (container.current) {
        while (container.current.firstChild) {
          container.current.removeChild(container.current.firstChild);
        }
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      {/* Widget will be injected here */}
    </div>
  );
}

export default memo(TradingViewWidget);
