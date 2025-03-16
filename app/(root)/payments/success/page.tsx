"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

const SuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // You can access query parameters like this:
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sessionId = searchParams.get("session_id"); // Will be used for verification

    // Optionally, you can verify the session ID with your server here.
    // This is a crucial step to ensure the payment was successful and valid.
    // Example:
    // const verifySession = async () => {
    //   const response = await fetch('/api/verify-session', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ sessionId }),
    //   });
    //
    //   if (response.ok) {
    //     // Session is valid, update your database, etc.
    //   } else {
    //     // Session is invalid, handle the error.
    //     console.error('Session verification failed');
    //   }
    // };
    //
    // verifySession();

    // Redirect to a confirmation page or order details page after a delay.
    const timeoutId = setTimeout(() => {
      // Replace '/order-confirmation' with the actual path to your confirmation page.
      // You might want to include the session ID or order ID in the URL.
      router.push("/dashboard");
    }, 3000); // Redirect after 3 seconds

    return () => clearTimeout(timeoutId); // Clear the timeout if the component unmounts.
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md">
        <h1 className="text-2xl font-semibold text-green-600 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-700 mb-4">
          Thank you for your purchase. We&apos;ve sent a receipt to your email
          address.
        </p>
        <p className="text-gray-700 mb-4">
          You&apos;ll be redirected to your account page shortly.
        </p>
        <Button onClick={() => router.push("/account")}>Go to Account</Button>
      </div>
    </div>
  );
};

export default SuccessPage;
