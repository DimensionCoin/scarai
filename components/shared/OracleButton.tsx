"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GiCrystalBall } from "react-icons/gi";

interface OracleButtonProps {
  children: ReactNode;
}

export default function OracleButton({ children }: OracleButtonProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsScrolling(true);
      timeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 2000);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* Render the children (layout content) */}
      {children}

      {/* Show the button only if not on /oracle */}
      {pathname !== "/oracle" && (
        <Link href="/oracle">
          <div
            className={`fixed bottom-4 right-4 z-50 flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-all duration-300 ${
              isScrolling || isHovering ? "scale-105" : "scale-100"
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/40 to-indigo-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>

            {/* Glass background */}
            <div
              className={`relative flex items-center justify-center h-12 w-12 rounded-full border border-white/15 backdrop-blur-xl transition-all duration-300 ${
                isScrolling || isHovering
                  ? "bg-black/30 border-teal-500/30"
                  : "bg-black/20 border-white/10"
              }`}
            >
              {/* Icon with subtle glow effect */}
              <div className="relative">
                {(isScrolling || isHovering) && (
                  <div className="absolute -inset-2 rounded-full bg-teal-400/10 blur-sm transition-opacity duration-300"></div>
                )}
                <GiCrystalBall
                  size={24}
                  className={`transition-colors duration-300 ${
                    isScrolling || isHovering
                      ? "text-teal-400"
                      : "text-zinc-300"
                  }`}
                />
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
