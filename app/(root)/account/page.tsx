"use client";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useUserContext } from "@/providers/UserProvider";
import { motion } from "framer-motion";
import { Mail, CreditCard, Shield, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const AccountPage = () => {
  const { user, isLoaded } = useUser();
  const { tier, credits } = useUserContext();

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 opacity-75 blur animate-pulse"></div>
          <div className="relative bg-zinc-900 rounded-full p-4">
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
        return 2500;
      case "premium":
        return 5000;
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

  return (
    <div className="min-h-screen py-6 px-4 sm:px-2 relative overflow-hidden">
      <motion.div
        className="max-w-4xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          className="flex items-center justify-between mb-8"
          variants={itemVariants}
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
            Your Account
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-teal-400 hover:bg-zinc-800/50"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <SignOutButton>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/50"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </SignOutButton>
          </div>
        </motion.div>

        {/* Main profile card with glassmorphism effect */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl"
        >
          <div className="relative bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.3)]">
            {/* Top section with avatar and name */}
            <div className="relative h-40 sm:h-48 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-indigo-500/20"></div>
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=200&width=1000')] bg-cover bg-center opacity-10"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent"></div>
            </div>

            <div className="relative -mt-20 px-6 pb-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                {/* Avatar with glow effect */}
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 to-indigo-500 opacity-70 blur"></div>
                  <div className="relative h-28 w-28 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-4 border-zinc-900">
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl || "/placeholder.svg"}
                        alt={user.firstName || "User"}
                        height={112}
                        width={112}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-teal-400">
                        {user.firstName?.[0] ||
                          user.emailAddresses[0]?.emailAddress?.[0] ||
                          "U"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name and tier badge */}
                <div className="flex flex-col items-center sm:items-start mt-4 sm:mt-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/50 backdrop-blur-sm border border-white/5 text-zinc-300">
                      {tier === "free"
                        ? "Free Tier"
                        : tier === "basic"
                        ? "Basic Tier"
                        : "Premium Tier"}
                    </div>
                  </div>
                </div>
              </div>

              {/* User information cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {/* Email */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/30 backdrop-blur-sm border border-white/5 transition-colors"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-300">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">Email</h3>
                    <p className="text-zinc-200 font-medium mt-1">
                      {user.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                </motion.div>

                {/* Tier details */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/30 backdrop-blur-sm border border-white/5 transition-colors"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-300">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">
                      Membership
                    </h3>
                    <p className="text-zinc-200 font-medium mt-1">
                      {tier === "free"
                        ? "Free Account"
                        : tier === "basic"
                        ? "Basic Account"
                        : "Premium Account"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {tier === "free"
                        ? "Limited features access"
                        : tier === "basic"
                        ? "Standard features access"
                        : "Full platform access"}
                    </p>
                  </div>
                </motion.div>

                {/* Credits */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/30 backdrop-blur-sm border border-white/5 transition-colors md:col-span-2"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-300">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-zinc-400">
                      Credits
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-zinc-200 font-medium">
                        {credits || 0} / {getMaxCredits()} credits available
                      </p>
                      {tier !== "premium" && (
                        <Link href="/account/subscribe">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white border-0"
                          >
                            {tier === "free" ? "Upgrade" : "Go Premium"}
                          </Button>
                        </Link>
                      )}
                    </div>
                    <div className="w-full bg-zinc-700/30 rounded-full h-2 mt-2">
                      <div
                        className="h-2 rounded-full bg-teal-400/80"
                        style={{
                          width: `${calculateProgressPercentage()}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AccountPage;
