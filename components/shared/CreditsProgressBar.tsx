"use client";
import { useUserContext } from "@/providers/UserProvider";
import Link from "next/link";

type SubscriptionTierLimits = {
  free: number;
  basic: number;
  premium: number;
};

const CREDIT_LIMITS: SubscriptionTierLimits = {
  free: 20,
  basic: 2500,
  premium: 5000,
};

export const CreditsProgressBar = () => {
  const { tier, credits } = useUserContext();

  // Get the maximum credits for the current tier
  const maxCredits = CREDIT_LIMITS[tier];

  // Calculate percentage remaining
  const percentRemaining = Math.min(
    100,
    Math.max(0, (credits / maxCredits) * 100)
  );

  // Determine color based on percentage remaining
  const getColorClass = () => {
    if (percentRemaining > 60) return "from-emerald-500 to-teal-500";
    if (percentRemaining > 30) return "from-amber-500 to-yellow-500";
    return "from-red-500 to-rose-500";
  };

  // Format tier name with first letter capitalized
  const formattedTier = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-1.5">
        <div className="text-xs font-medium text-zinc-400">Credits</div>
        <div className="text-xs font-semibold text-zinc-300">
          {credits} <span className="text-zinc-500">/ {maxCredits}</span>
        </div>
      </div>

      <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getColorClass()} shadow-[0_0_8px_rgba(45,212,191,0.3)]`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>

      <div className="mt-1.5 text-xs text-zinc-500 flex items-center justify-between">
        <span>{formattedTier} Tier</span>

        {/* Only show upgrade link if not premium tier */}
        {tier !== "premium" && (
          <Link
            href="/account/subscribe"
            className="text-teal-400 hover:text-teal-300 hover:underline cursor-pointer transition"
          >
            Upgrade
          </Link>
        )}
      </div>
    </div>
  );
};
