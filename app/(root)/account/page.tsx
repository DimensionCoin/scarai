"use client";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useUserContext } from "@/providers/UserProvider";
import { motion } from "framer-motion";
import {
  Mail,
  CreditCard,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Zap,
  BarChart3,
  User,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const AccountPage = () => {
  const { user, isLoaded } = useUser();
  const { tier, credits } = useUserContext();
  const [history, setHistory] = useState<
    {
      type: "coin" | "oracle";
      coin?: string;
      message?: string;
      creditsUsed: number;
      timestamp: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/credit-history?clerkId=${user.id}`);
        const data = await res.json();
        if (data?.history) setHistory(data.history);
      } catch (error) {
        console.error("Failed to fetch credit history:", error);
      }
    };

    if (user?.id) {
      fetchHistory();
    }
  }, [user?.id]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 opacity-75 blur animate-pulse"></div>
          <div className="relative bg-black/40 backdrop-blur-xl rounded-full p-4">
            <div className="h-8 w-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin"></div>
          </div>
        </div>
        <p className="ml-3 text-zinc-300">Loading account information...</p>
      </div>
    );
  }

  // Calculate max credits based on tier
  const getMaxCredits = () => {
    switch (tier) {
      case "free":
        return 20;
      case "basic":
        return 1500;
      case "premium":
        return 3000;
      default:
        return 100;
    }
  };

  // Calculate progress percentage
  const calculateProgressPercentage = () => {
    const maxCredits = getMaxCredits();
    return Math.min((credits / maxCredits) * 100, 100);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  // Get tier badge color
  const getTierBadgeColor = () => {
    switch (tier) {
      case "free":
        return "bg-zinc-800/50 text-zinc-300 border-zinc-700/50";
      case "basic":
        return "bg-teal-500/20 text-teal-300 border-teal-500/30";
      case "premium":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      default:
        return "bg-zinc-800/50 text-zinc-300 border-zinc-700/50";
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-teal-500/10 rounded-full filter blur-[100px] transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full filter blur-[100px] transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 bg-cyan-500/5 rounded-full filter blur-[120px] transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <motion.div
        className="max-w-6xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header section */}
        <motion.div
          className="flex items-center justify-between mb-8"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
              Account Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-teal-400 hover:bg-white/5 rounded-xl"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <SignOutButton>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-rose-400 hover:bg-white/5 rounded-xl"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </SignOutButton>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Profile section */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="relative bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              {/* Profile header with gradient */}
              <div className="h-24 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-indigo-500/20 relative">
                <div className="absolute inset-0 bg-[url('/placeholder.svg?height=200&width=1000')] bg-cover bg-center opacity-10"></div>
                <div className="absolute inset-0 backdrop-blur-sm"></div>
              </div>

              {/* Avatar and name */}
              <div className="px-6 pb-6 relative">
                <div className="flex flex-col items-center -mt-12">
                  {/* Avatar with glow effect */}
                  <div className="relative mb-4">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 opacity-70 blur"></div>
                    <div className="relative h-24 w-24 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-black/40">
                      {user.imageUrl ? (
                        <Image
                          src={user.imageUrl || "/placeholder.svg"}
                          alt={user.firstName || "User"}
                          height={96}
                          width={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-teal-400">
                          {user.firstName?.[0] ||
                            user.emailAddresses[0]?.emailAddress?.[0] ||
                            "U"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name and tier badge */}
                  <h2 className="text-xl font-bold text-white mb-1">
                    {user.firstName} {user.lastName}
                  </h2>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getTierBadgeColor()} flex items-center gap-1.5`}
                  >
                    {tier === "premium" && <Sparkles className="h-3 w-3" />}
                    {tier === "free"
                      ? "Free Tier"
                      : tier === "basic"
                      ? "Basic Tier"
                      : "Premium Tier"}
                  </div>

                  {/* Email */}
                  <div className="mt-4 w-full">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
                      <Mail className="h-4 w-4 text-teal-400" />
                      <p className="text-sm text-zinc-300 truncate">
                        {user.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>
                  </div>

                  {/* Membership info */}
                  <div className="mt-4 w-full">
                    <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2 px-1">
                      Membership Benefits
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-teal-400" />
                          <span className="text-sm text-zinc-300">
                            Account Type
                          </span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {tier === "free"
                            ? "Free"
                            : tier === "basic"
                            ? "Basic"
                            : "Premium"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-teal-400" />
                          <span className="text-sm text-zinc-300">
                            Features
                          </span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {tier === "free"
                            ? "Limited"
                            : tier === "basic"
                            ? "Standard"
                            : "Full Access"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade button */}
                  {tier !== "premium" && (
                    <div className="mt-6 w-full">
                      <Link href="/account/subscribe" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white border-0 rounded-xl h-11">
                          <Sparkles className="h-4 w-4 mr-2" />
                          {tier === "free"
                            ? "Upgrade to Basic"
                            : "Upgrade to Premium"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column - Credits and History */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 space-y-6"
          >
            {/* Credits card */}
            <div className="relative bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full filter blur-[50px] transform translate-x-1/3 -translate-y-1/3"></div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Credits Balance
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Track your usage and available credits
                  </p>
                </div>
              </div>

              <div className="relative z-10">
                {/* Credits counter */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">
                      Available Credits
                    </p>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">
                        {credits || 0}
                      </span>
                      <span className="text-lg text-zinc-500 ml-2">
                        / {getMaxCredits()}
                      </span>
                    </div>
                  </div>

                  {tier !== "premium" && (
                    <Link href="/account/subscribe">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white border-0 rounded-lg"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        {tier === "free"
                          ? "Get More Credits"
                          : "Upgrade for More"}
                        <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Progress bar */}
                <div className="relative w-full h-3 bg-black/40 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-600"
                    style={{
                      width: `${calculateProgressPercentage()}%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-zinc-500">
                  <span>0</span>
                  <span>{getMaxCredits() / 2}</span>
                  <span>{getMaxCredits()}</span>
                </div>
              </div>
            </div>

            {/* Usage history */}
            {history.length > 0 && (
              <div className="relative bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Usage History
                    </h2>
                    <p className="text-sm text-zinc-400">
                      Recent credit transactions
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 px-2 text-left text-xs uppercase tracking-wider text-zinc-500 font-medium">
                          Type
                        </th>
                        <th className="py-3 px-2 text-left text-xs uppercase tracking-wider text-zinc-500 font-medium">
                          Detail
                        </th>
                        <th className="py-3 px-2 text-left text-xs uppercase tracking-wider text-zinc-500 font-medium">
                          Credits
                        </th>
                        <th className="py-3 px-2 text-left text-xs uppercase tracking-wider text-zinc-500 font-medium">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.slice(0, 10).map((entry, i) => (
                        <tr
                          key={i}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                  entry.type === "oracle"
                                    ? "bg-indigo-500/20 text-indigo-400"
                                    : "bg-teal-500/20 text-teal-400"
                                }`}
                              >
                                {entry.type === "oracle" ? (
                                  <Sparkles className="h-3 w-3" />
                                ) : (
                                  <Zap className="h-3 w-3" />
                                )}
                              </div>
                              <span className="text-zinc-300 capitalize">
                                {entry.type}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-zinc-400 max-w-[200px] truncate">
                            {entry.type === "coin"
                              ? entry.coin
                              : entry.message?.slice(0, 30) + "..."}
                          </td>
                          <td className="py-3 px-2">
                            <span className="font-medium text-white">
                              {entry.creditsUsed}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(entry.timestamp)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {history.length > 10 && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-zinc-400 hover:text-teal-400 hover:bg-white/5 rounded-lg"
                    >
                      View All History
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountPage;
