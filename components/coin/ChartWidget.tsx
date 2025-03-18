"use client";

import { useState, useEffect, useRef, memo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChartWidgetProps {
  symbol: string; // e.g., "BINANCE:BTCUSDT"
  coinName?: string; // Optional coin name for display
  hideSideToolbar?: boolean; // Optional parameter to hide the side toolbar
}

function ChartWidget({
  symbol,
  coinName,
  hideSideToolbar = false,
}: ChartWidgetProps) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !symbol) return;

    // Delay script injection to ensure modal layout has been applied.
    const timer = setTimeout(() => {
      // Clear previous content if any
      if (container.current) {
        container.current.innerHTML = "";
      }

      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: true,
        width: "100%",
        height: "100%",
        symbol: symbol, // Use the provided symbol (already built with market info)
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        backgroundColor: "rgba(0, 0, 0, 1)",
        gridColor: "rgba(0, 255, 255, 0.12)",
        hide_legend: false,
        hide_side_toolbar: hideSideToolbar, // Use the prop to determine whether to hide the side toolbar
        allow_symbol_change: false,
        support_host: "https://www.tradingview.com",
      });

      if (container.current) {
        container.current.appendChild(script);
      }
    }, 300); // 300ms delay

    return () => {
      clearTimeout(timer);
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [open, symbol, hideSideToolbar]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="relative group overflow-hidden rounded-xl border border-white/15 bg-black/10 backdrop-blur-xl px-4 py-2.5 transition-all duration-300 hover:border-teal-500/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 to-indigo-500/0 opacity-0 group-hover:from-teal-500/10 group-hover:to-indigo-500/10 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center gap-2">
          <LineChart className="h-4 w-4 text-teal-400" />
          <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
            {coinName ? `${coinName} Chart` : "View Full Chart"}
          </span>
          <Maximize2 className="h-3.5 w-3.5 text-zinc-400 group-hover:text-teal-400 transition-colors ml-1" />
        </div>
      </Button>

      {/* Use a custom portal container to avoid Dialog's default max-width constraints */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="!max-w-none w-[98vw] h-[98vh] p-0 m-0 border border-white/15 rounded-xl overflow-hidden bg-black/90"
          style={{ maxWidth: "none" }} // Force override any max-width constraints
        >
          <DialogTitle className="sr-only">
            {coinName ? `${coinName} Chart` : symbol} Trading View Chart
          </DialogTitle>

          {/* Chart Container */}
          <div
            className="tradingview-widget-container w-full h-full"
            ref={container}
          >
            <div className="tradingview-widget-container__widget w-full h-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(ChartWidget);
