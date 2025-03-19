"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

const SuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

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
    const timeoutId = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(countdownInterval);
    };
  }, [router, searchParams]);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex items-center justify-center overflow-hidden">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-zinc-900 to-zinc-950 opacity-80"></div>

      {/* Subtle particles in background */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-teal-400/30"
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
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-indigo-500/10"></div>

        <div className="relative p-8 flex flex-col items-center">
          {/* Success icon with animation */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 blur-md"></div>
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-teal-400/20 to-indigo-500/20 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-teal-400 animate-pulse" />
            </div>
          </div>

          {/* Success text */}
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-500 mb-4 text-center">
            PAYMENT SUCCESSFUL
          </h2>

          {/* Message */}
          <p className="text-zinc-300 text-sm text-center mb-6">
            Thank you for your purchase. We've sent a receipt to your email
            address.
          </p>

          {/* Redirect message */}
          <div className="w-full p-3 bg-white/5 rounded-lg mb-6 text-center">
            <p className="text-zinc-400 text-sm">
              Redirecting to dashboard in {countdown > 0 ? countdown : 0}s
            </p>
            <div className="w-full h-1 bg-zinc-800/50 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Button */}
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white border-none"
          >
            Go to Dashboard Now
          </Button>
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

export default SuccessPage;
