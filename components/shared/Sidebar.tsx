"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Newspaper,
  CoinsIcon,
  ChevronRight,
} from "lucide-react";
import { GiCrystalBall } from "react-icons/gi";

import { CreditsProgressBar } from "./CreditsProgressBar";

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Oracle",
      href: "/oracle",
      icon: GiCrystalBall,
    },
    {
      name: "Coins",
      href: "/coinpage",
      icon: CoinsIcon,
    },
    {
      name: "Exchanges",
      href: "/explore",
      icon: Search,
    },

    {
      name: "Insights",
      href: "/news",
      icon: Newspaper,
    },
  ];

  return (
    <div className="hidden md:flex h-screen w-50 flex-col fixed left-0 top-[58px] z-30">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xl border-r border-white/5 shadow-[4px_4px_15px_-8px_rgba(0,0,0,0.5)] pt-[59px]"></div>

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-teal-500/5 via-transparent to-indigo-500/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-[calc(100vh-60px)]">
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-8 px-4">
          <ul className="space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.name}>
                  <Link href={item.href} className="block">
                    <motion.div
                      className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                        isActive
                          ? "bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-white shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      whileHover={
                        !isActive
                          ? {
                              backgroundColor: "rgba(39, 39, 42, 0.4)",
                              transition: { duration: 0.2 },
                            }
                          : {}
                      }
                    >
                      {/* Glow effect for active item */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/10 to-indigo-500/10 blur-sm"></div>
                      )}

                      {/* Icon container with glow */}
                      <div
                        className={`relative ${
                          isActive
                            ? "text-teal-400"
                            : "text-zinc-400 group-hover:text-teal-400"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        {isActive && (
                          <div className="absolute inset-0 bg-teal-400/20 blur-md rounded-full"></div>
                        )}
                      </div>

                      <span
                        className={`font-medium ${
                          isActive ? "text-white" : ""
                        }`}
                      >
                        {item.name}
                      </span>

                      {/* Active indicator */}
                      {isActive ? (
                        <div className="ml-auto flex items-center gap-2">
                          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]"></div>
                        </div>
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </motion.div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Credits Progress Bar */}
        <div className="mt-auto mb-4 mx-2 bg-zinc-900/40 rounded-lg backdrop-blur-sm">
          <CreditsProgressBar />
        </div>

        {/* Footer */}
        <div className="relative p-6 border-t border-white/5">
          <div className="text-xs text-zinc-500">
            <p>© 2025 SCAR</p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
