// components/coin/TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from "react";

interface TradingViewWidgetProps {
  symbol: string; // e.g., "BTC", "SHIB"
}

function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!symbol) return;

    const uppercaseSymbol = symbol.toUpperCase();
    console.log("TradingView Symbol:", `BINANCE:${uppercaseSymbol}USDT`); // Debug log

    // Clear existing content to prevent duplicates
    if (container.current) {
      container.current.innerHTML = ""; // Reset container
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
      symbol: `BINANCE:${uppercaseSymbol}USDT`, // Dynamic symbol with Binance
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
      // Cleanup: Remove script and reset container
      if (container.current) {
        while (container.current.firstChild) {
          container.current.removeChild(container.current.firstChild);
        }
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      {/* Widget will be injected here by the script */}
    </div>
  );
}

export default memo(TradingViewWidget);
