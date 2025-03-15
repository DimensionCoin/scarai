"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

const SuccessPayment = () => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });

      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/dashboard");
    }, 4000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl">
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-xl shadow-xl p-8 text-center w-full max-w-md">
        {windowSize.width > 0 && (
          <Confetti width={windowSize.width} height={windowSize.height} />
        )}
        <h1 className="text-2xl font-bold text-zinc-100 mb-4">
          Payment Successful
        </h1>
        <p className="text-zinc-400 mb-2">
          Your transaction was completed successfully.
        </p>
        <p className="text-zinc-500">We are updating your account...</p>
      </div>
    </div>
  );
};

export default SuccessPayment;
