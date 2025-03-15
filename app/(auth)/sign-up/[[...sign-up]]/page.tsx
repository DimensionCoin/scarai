"use client";

import { SignUp } from "@clerk/nextjs";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex flex-col">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header with logo */}
      <header className="relative z-10 p-4 flex justify-center md:justify-start md:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 opacity-75 blur group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-zinc-900 rounded-full p-2">
              <TrendingUp className="h-5 w-5 text-teal-400" />
            </div>
          </div>
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
            SCAR
          </span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mb-8 text-center"
        >
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
            Join SCAR
          </h1>
          <p className="text-zinc-400">
            Create an account to start your crypto journey
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 rounded-xl blur-sm"></div>
            <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-1 overflow-hidden">
              {/* Clerk SignUp component */}
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none",
                    headerTitle: "text-zinc-100",
                    headerSubtitle: "text-zinc-400",
                    socialButtonsBlockButton:
                      "bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
                    socialButtonsBlockButtonText: "text-zinc-200",
                    dividerLine: "bg-zinc-700",
                    dividerText: "text-zinc-500",
                    formFieldLabel: "text-zinc-300",
                    formFieldInput:
                      "bg-zinc-800/50 border-zinc-700 text-zinc-100",
                    formButtonPrimary:
                      "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white",
                    footerActionLink: "text-teal-400 hover:text-teal-300",
                    identityPreviewText: "text-zinc-300",
                    identityPreviewEditButton:
                      "text-teal-400 hover:text-teal-300",
                  },
                }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-zinc-500 text-sm">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </main>

      <footer className="relative z-10 p-4 text-center">
        <p className="text-zinc-500 text-xs">
          © {new Date().getFullYear()} Annex. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
