"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the LavaLampEffect to avoid SSR issues
const LavaLampEffect = dynamic(() => import("@/components/shared/LavaLampEffect"), {
  ssr: false,
  loading: () => (
    <div className="h-40 w-40 rounded-full bg-gradient-to-br from-teal-400/30 to-indigo-500/30 animate-pulse"></div>
  ),
});

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 3;
        return next > 100 ? 100 : next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950/10 z-50 flex items-center justify-center overflow-hidden">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-zinc-900 to-zinc-950 opacity-80"></div>

      {/* Subtle particles in background */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Glass card container */}
      <div className="relative w-80 md:w-96 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        {/* Highlight effect */}
        <div className="absolute inset-0 "></div>

        <div className="relative p-8 flex flex-col items-center">
          {/* Lava Lamp Effect - Centered with fixed size */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 blur-md"></div>
            <div className="relative h-56 w-56 rounded-full bg-black/30 backdrop-blur-sm overflow-hidden flex items-center justify-center">
              <LavaLampEffect size={240} />
            </div>
          </div>

          {/* Loading text */}
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-500 mb-6">
            INITIALIZING
          </h2>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Status text */}
          <div className="flex items-center">
            <p className="text-zinc-400 text-sm font-mono">
              Fetching Account Details
            </p>
            <div className="ml-2 flex space-x-1">
              <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-[pulse_1.5s_infinite_0ms]"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-[pulse_1.5s_infinite_300ms]"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-[pulse_1.5s_infinite_600ms]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating effect animation */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-10px) translateX(10px);
          }
          50% {
            transform: translateY(0) translateX(20px);
          }
          75% {
            transform: translateY(10px) translateX(10px);
          }
        }
      `}</style>
    </div>
  );
}
