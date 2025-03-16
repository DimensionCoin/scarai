"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CancelPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after 5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);

    return () => clearTimeout(timer); // Clear timeout if component unmounts
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-2xl font-semibold text-red-500 mb-4">
          Payment Cancelled
        </h1>
        <p className="text-gray-700 mb-4">
          We couldn&apos;t process your payment.
        </p>
        <p className="text-gray-700 mb-4">
          You&apos;ll be redirected to the home page in 5 seconds...
        </p>
        <p className="text-sm text-gray-500">
          If you are not redirected, click{" "}
          <Link href="/dashboard" className="text-blue-500">
            here
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default CancelPage;
