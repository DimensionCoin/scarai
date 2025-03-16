"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation"; // Import usePathname
import Link from "next/link";
import { GiCrystalBall } from "react-icons/gi";

interface OracleButtonProps {
  children: ReactNode;
}

export default function OracleButton({ children }: OracleButtonProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname(); // Get the current route

  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsScrolling(true);
      timeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
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
            className="fixed bottom-4 right-4 z-50 flex items-center justify-center rounded-full p-3 shadow-lg cursor-pointer"
            style={{
              backgroundColor: "#4F46E5",
              opacity: isScrolling ? 1 : 0.2,
              transition: "opacity 0.5s",
            }}
          >
            <GiCrystalBall size={24} color="#fff" />
          </div>
        </Link>
      )}
    </div>
  );
}
