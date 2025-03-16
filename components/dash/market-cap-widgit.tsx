"use client";

import { useEffect, useRef } from "react";

export default function MarketCapWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !containerRef.current ||
      scriptLoadedRef.current
    )
      return;

    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetContainer.appendChild(widgetDiv);

    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;

    const config = {
      symbol: "CRYPTOCAP:TOTAL",
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "12M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
    };

    script.innerHTML = JSON.stringify(config);

    widgetContainer.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        scriptLoadedRef.current = false;
      }
    };
  }, []);

  return (
    <div className="rounded-lg border border-zinc-700/30 bg-zinc-800/20 shadow-sm mb-4">
      <div className="flex items-center p-3 border-b border-zinc-700/30">
        <h3 className="text-sm font-medium text-white">Total Market Cap</h3>
      </div>
      <div className="h-[300px] w-full relative">
        {" "}
        {/* Increased height */}
        <div ref={containerRef} className="absolute inset-0">
          {!scriptLoadedRef.current && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
