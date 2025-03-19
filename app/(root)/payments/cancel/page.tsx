"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const CancelPage = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown effect
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect after delay
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex items-center justify-center overflow-hidden">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-zinc-900 to-zinc-950 opacity-80"></div>

      {/* Subtle particles in background */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-red-400/30"
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
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10"></div>

        <div className="relative p-8 flex flex-col items-center">
          {/* Error icon with animation */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-md"></div>
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-500 animate-pulse" />
            </div>
          </div>

          {/* Error text */}
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-orange-500 mb-4 text-center">
            PAYMENT DECLINED
          </h2>

          {/* Message */}
          <p className="text-zinc-300 text-sm text-center mb-6">
            We couldn&apos;t process your payment. Please check your payment
            details and try again.
          </p>

          {/* Redirect message */}
          <div className="w-full p-3 bg-white/5 rounded-lg mb-6 text-center">
            <p className="text-zinc-400 text-sm">
              Redirecting to dashboard in {countdown > 0 ? countdown : 0}s
            </p>
            <div className="w-full h-1 bg-zinc-800/50 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300 ease-out"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Buttons */}
          <div className="w-full space-y-3">
            <Button
              onClick={() => router.push("/account/subscribe")}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-none"
            >
              Try Again
            </Button>

            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="w-full border-white/20 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              Return to Dashboard
            </Button>
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
};

export default CancelPage;
