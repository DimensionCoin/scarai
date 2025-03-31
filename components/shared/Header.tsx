"use client";
import { useState } from "react";
import { SignedIn, SignOutButton, useUser } from "@clerk/nextjs";
import { CiLogout } from "react-icons/ci";
import {
  Bell,
  UserIcon,
  Settings,
  CreditCard,
  User,
  Shield,
  ChevronDown,
  LayoutDashboard,
  Search,
  Newspaper,
  CoinsIcon,
} from "lucide-react";
import { GiCrystalBall } from "react-icons/gi";
import { Button } from "../ui/button";
import { useEffect, useCallback } from "react";
import { getUser } from "@/actions/user.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { CreditsProgressBar } from "./CreditsProgressBar";
import { useUserContext } from "@/providers/UserProvider";
import LoadingScreen from "./LoadingScreen";
import LavaLampEffect from "./LavaLampEffect";
import { useRouter } from "next/navigation";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const Header = () => {
  const router = useRouter()
  const { user, isLoaded } = useUser();
  const { tier, isContextLoaded } = useUserContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      await getUser(userId);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData(user.id);
    }
  }, [isLoaded, user, fetchUserData]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Show loading screen if either user or context data is not loaded
  if (!isLoaded || !isContextLoaded) {
    return <LoadingScreen />;
  }

  const editPaymentDetails = async () => {
    const url = process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL!;
    if (url) {
      router.push(
        url + "?prefilled_email=" + user?.emailAddresses[0]?.emailAddress
      );
    } else {
      throw new Error("Failed to edit payment details");
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center w-full py-2 px-4 md:px-6 ">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xl shadow-[0_4px_15px_rgba(0,0,0,0.3)] md:shadow-[0_4px_15px_-8px_rgba(0,0,0,0.3),_4px_0_15px_-8px_rgba(0,0,0,0.3)]"></div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-teal-500/5 via-transparent to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex justify-between items-center w-full">
          {/* Left side - Logo/Menu */}
          <div className="flex items-center">
            {/* Logo area that toggles mobile menu on small screens */}
            <button
              className="relative group focus:outline-none flex items-center gap-2 md:gap-3"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-teal-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <div className="h-14 w-14 rounded-full flex items-center justify-center overflow-hidden">
                <LavaLampEffect />
              </div>
              <h2 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500 tracking-wide">
                SCAR
              </h2>
              {/* Down arrow indicator (only visible on mobile) */}
              <ChevronDown
                className={`h-4 w-4 text-teal-400 md:hidden transition-transform duration-300 ${
                  mobileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Right side - User controls */}
          <div className="flex items-center gap-3 md:gap-6">
            <SignedIn>
              {user && (
                <div className="flex gap-3 md:gap-6 items-center">
                  {tier === "premium" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative group hover:bg-black"
                    >
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                      <div className="relative">
                        <Bell className="h-5 w-5 text-zinc-300 hover:text-black" />
                        <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_5px_rgba(45,212,191,0.7)]" />
                      </div>
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-3 hover:bg-zinc-800/50 group border border-white/10"
                      >
                        <div className="relative ">
                          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-teal-400/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                          <UserIcon className="h-5 w-5 text-zinc-300 relative" />
                        </div>
                        <span className="text-zinc-300">{user.firstName}</span>
                        <ChevronDown className="h-4 w-4 text-zinc-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-zinc-900/90 backdrop-blur-md border-zinc-800/50 text-zinc-300 shadow-[0_0_20px_rgba(0,0,0,0.3)] rounded-xl overflow-hidden"
                    >
                      <div className="px-3 py-2 text-sm font-medium border-b border-zinc-800/50">
                        <p className="text-zinc-400">Signed in as</p>
                        <p className="truncate text-teal-400">
                          {user.emailAddresses[0]?.emailAddress}
                        </p>
                      </div>

                      <div className="p-1">
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer hover:bg-zinc-800/50 focus:bg-zinc-800/50 rounded-lg px-2 py-1.5"
                        >
                          <Link
                            href="/account"
                            className="flex items-center gap-2"
                          >
                            <User className="h-4 w-4" />
                            <span>Account</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer hover:bg-zinc-800/50 focus:bg-zinc-800/50 rounded-lg px-2 py-1.5"
                        >
                          <Link
                            href="/settings"
                            className="flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer hover:bg-zinc-800/50 focus:bg-zinc-800/50 rounded-lg px-2 py-1.5"
                        >
                        
                            <button onClick={editPaymentDetails}>
                              <CreditCard className="h-4 w-4" />
                              <span>Billing</span>
                            </button>
                        </DropdownMenuItem>

                        {/* Admin Button (Only visible if user is admin) */}
                        {user.emailAddresses[0]?.emailAddress ===
                          ADMIN_EMAIL && (
                          <DropdownMenuItem
                            asChild
                            className="cursor-pointer hover:bg-zinc-800/50 focus:bg-zinc-800/50 rounded-lg px-2 py-1.5 text-teal-400"
                          >
                            <Link
                              href="/admin"
                              className="flex items-center gap-2"
                            >
                              <Shield className="h-4 w-4" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </div>

                      <DropdownMenuSeparator className="bg-zinc-800/50" />
                      <div className="p-1">
                        <SignOutButton>
                          <DropdownMenuItem className="cursor-pointer text-red-500 hover:bg-zinc-800/50 focus:bg-zinc-800/50 hover:text-red-400 focus:text-red-400 rounded-lg px-2 py-1.5">
                            <CiLogout className="h-4 w-4 mr-2" />
                            <span>Sign out</span>
                          </DropdownMenuItem>
                        </SignOutButton>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              className="absolute top-[58px] left-0 bottom-0 w-52 bg-zinc-950/80 backdrop-blur-xl border-r border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-auto"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Decorative elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-teal-500/5 via-transparent to-indigo-500/5"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              </div>

              {/* Navigation */}
              <nav className="relative z-10 py-8 px-4 mb-36">
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
                            {isActive && (
                              <div className="ml-auto flex items-center gap-2">
                                <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]"></div>
                              </div>
                            )}
                          </motion.div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              {/* Credits Progress Bar */}
              <div className="mt-auto mb-4 mx-4 bg-zinc-900/40 rounded-lg backdrop-blur-sm">
                <CreditsProgressBar />
              </div>
              {/* Footer */}
              <div className="relative p-6 border-t border-white/5 mt-auto">
                <div className="text-xs text-zinc-500">
                  <p>© 2025 SCAR</p>
                  <p className="mt-1">Version 1.0.0</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to push content below fixed header */}
      <div className="h-[72px]"></div>
    </>
  );
};

export default Header;
