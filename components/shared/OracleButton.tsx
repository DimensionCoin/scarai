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
      }, 3000);
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
            className={`fixed bottom-4 right-4 z-50 flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-all duration-200 ${
              isScrolling || isHovering ? "scale-110" : "scale-80"
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >

            {/* Glass background */}
            <div
              className={`relative flex items-center justify-center h-12 w-12 rounded-full border border-white/15 backdrop-blur-lg transition-all duration-200 ${
                isScrolling || isHovering
                  ? "bg-black/10 border-teal-500/10"
                  : "bg-black/5 border-white/5"
              }`}
            >
              {/* Icon with pulse effect */}
              <div className="relative">
                {(isScrolling || isHovering) && (
                  <div className="absolute inset-0 rounded-full bg-teal-400/60 animate-ping"></div>
                )}
                <GiCrystalBall
                  size={24}
                  className={`transition-colors duration-300 ${
                    isScrolling || isHovering
                      ? "text-teal-400"
                      : "text-zinc-300/10"
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
