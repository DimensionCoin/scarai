"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { subscribe } from "@/actions/stripe.actions";
import { motion } from "framer-motion";
import { useUserContext } from "@/providers/UserProvider";
import { toast } from "sonner";

export default function SubscribePage() {
  const { user, isSignedIn } = useUser();
  const { tier: currentTier } = useUserContext();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Subscription Plans
  const tiers = [
    {
      id: 0,
      name: "basic",
      description: "For beginner investors",
      price: "$25 USD",
      credits: "1,500 credits monthly",
      features: [
       
      ],
      color: "from-teal-400 to-cyan-500",
      shadowColor: "rgba(45, 212, 191, 0.3)",
      popular: true,
    },
    {
      id: 1,
      name: "premium",
      description: "For experienced traders",
      price: "$30 USD",
      credits: "3,000 credits monthly",
      features: [
       
      ],
      color: "from-violet-400 to-indigo-500",
      shadowColor: "rgba(139, 92, 246, 0.3)",
    },
  ];

  const handleSubscribe = async (tier: "basic" | "premium") => {
    if (!isSignedIn) {
      toast.error("Authentication Required", {
        description: "Please sign in to subscribe to a plan.",
      });
      return;
    }

    // Reset any previous errors
    setError(null);

    // Set loading state for the specific tier
    setIsLoading(tier);

    try {
      // Get the appropriate price ID based on the tier
      const priceId =
        tier === "basic"
          ? process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;

      console.log(`Subscribing to ${tier} tier with price ID: ${priceId}`);

      if (!priceId) {
        console.error(`Price ID for ${tier} tier is not defined`);
        setError(`Configuration error: Price ID for ${tier} tier is missing`);
        toast.error("Configuration Error", {
          description: `Price ID for ${tier} tier is missing. Please contact support.`,
        });
        return;
      }

      const url = await subscribe({
        userId: user?.id || "",
        email: user?.emailAddresses[0]?.emailAddress || "",
        priceId: priceId,
      });

      if (url) {
        console.log(`Redirecting to: ${url}`);
        router.push(url);
      } else {
        console.error("Failed to get checkout URL");
        setError("Failed to start checkout process");
        toast.error("Checkout Error", {
          description:
            "Failed to start checkout process. Please try again later.",
        });
      }
    } catch (error) {
      console.error("Subscription error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during the subscription process";
      setError(errorMessage);
      toast.error("Subscription Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(null);
    }
  };

  if (!isLoaded) {
    return null; // Prevent flash of content during hydration
  }

  return (
    <div className="min-h-screen w-full">
      {/* Back button */}
      <div className="relative z-10 p-4">
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-violet-500">
              Choose Your Plan
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
              Unlock the full potential of SCAR with the right plan for your
              needs.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm text-center">
              {error}
              <div className="mt-2 text-xs">
                Please check your environment variables and Stripe
                configuration.
              </div>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 max-w-4xl mx-auto">
            {tiers.map((tier) => (
              <motion.div
                key={tier.id}
                className="relative group w-full sm:max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: tier.id * 0.1 }}
              >
                {/* Card glow effect */}
                <div
                  className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${tier.color} opacity-0 group-hover:opacity-20 blur-sm transition-opacity`}
                ></div>

                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 opacity-80 blur-sm"></div>
                      <div className="relative bg-zinc-900/90 backdrop-blur-sm text-xs font-medium text-teal-400 px-3 py-1 rounded-full border border-teal-500/20 shadow-[0_0_10px_rgba(45,212,191,0.3)] flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Popular
                      </div>
                    </div>
                  </div>
                )}

                <Card className="relative bg-zinc-900/50 backdrop-blur-sm border-zinc-800/50 hover:border-zinc-700/50 text-zinc-300 rounded-xl overflow-hidden h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl capitalize text-white flex items-center gap-2">
                      {tier.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-zinc-400">
                      {tier.description}
                    </CardDescription>
                    <div className="flex items-baseline mt-3 space-x-1">
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        {tier.price}
                      </span>
                      <span className="text-xs sm:text-sm text-zinc-400">
                        /month
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-teal-400 font-medium">
                      {tier.credits}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3 text-sm">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="relative mt-0.5">
                            <div
                              className={`absolute -inset-1 rounded-full bg-gradient-to-r ${tier.color} opacity-20 blur-sm`}
                            ></div>
                            <Check className="h-4 w-4 text-teal-400 relative" />
                          </div>
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  {/* Subscription Button Logic */}
                  <CardFooter>
                    {currentTier === tier.name ? (
                      <div className="w-full py-2 text-center border border-zinc-700/50 rounded-lg text-zinc-400 text-sm">
                        Current Plan
                      </div>
                    ) : (
                      <Button
                        onClick={() =>
                          handleSubscribe(tier.name as "basic" | "premium")
                        }
                        disabled={isLoading !== null}
                        className="w-full relative group overflow-hidden"
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${tier.color} opacity-90`}
                        ></div>
                        <span className="relative text-white font-medium">
                          {isLoading === tier.name
                            ? "Processing..."
                            : "Subscribe"}
                        </span>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Footer note */}
          <div className="text-center text-sm text-zinc-500 mt-12">
            <p>
              All plans include access to our core features. Subscription renews
              automatically.
            </p>
            
          </div>
        </motion.div>
      </div>
    </div>
  );
}
