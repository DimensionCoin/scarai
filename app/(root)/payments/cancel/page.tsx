"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

const FailedPayment = () => {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl">
      <div className="bg-zinc-900 border border-red-600 rounded-xl shadow-xl p-8 text-center w-full max-w-md">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-red-400 mb-4">Payment Failed</h1>
        <p className="text-zinc-400 mb-2">
          Something went wrong with your transaction.
        </p>
        <p className="text-zinc-500">Redirecting you back to the dashboard...</p>
      </div>
    </div>
  );
};

export default FailedPayment;
