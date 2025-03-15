"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  TrendingUp,
  Zap,
  Shield,
  Search,
  Brain,
} from "lucide-react";
import { motion } from "framer-motion";

const Home = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <motion.div
          className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-6">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 opacity-75 blur"></div>
            <div className="relative bg-zinc-900 rounded-full p-3">
              <TrendingUp className="h-8 w-8 text-teal-400" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
            Welcome to SCAR
          </h1>

          <p className="text-xl text-zinc-300 mb-8 max-w-2xl">
            Your Specilizied Crypto Asset Researcher for navigating the complex world of
            cryptocurrency investing with confidence and clarity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/sign-up">
              <Button className="px-6 py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white border-0 rounded-xl font-medium text-lg flex items-center gap-2 transition-all hover:shadow-[0_0_25px_rgba(45,212,191,0.3)]">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                variant="outline"
                className="px-6 py-6 bg-zinc-800/50 border-zinc-700/50 text-zinc-100 hover:bg-zinc-700/50 hover:text-teal-400 hover:border-teal-500/30 rounded-xl font-medium text-lg"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 hover:shadow-[0_0_25px_rgba(45,212,191,0.1)] transition-shadow duration-500"
          >
            <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
              <BarChart2 className="h-6 w-6 text-teal-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-100">
              Real-Time Market Data
            </h3>
            <p className="text-zinc-400">
              Access comprehensive, up-to-the-minute cryptocurrency market data
              to make informed investment decisions.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 hover:shadow-[0_0_25px_rgba(45,212,191,0.1)] transition-shadow duration-500"
          >
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-100">
              AI-Powered Analysis
            </h3>
            <p className="text-zinc-400">
              Leverage advanced AI algorithms that analyze market trends and
              provide personalized trading insights.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 hover:shadow-[0_0_25px_rgba(45,212,191,0.1)] transition-shadow duration-500"
          >
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-100">
              Comprehensive Research
            </h3>
            <p className="text-zinc-400">
              Discover detailed information about any cryptocurrency, including
              market stats, contract addresses, and historical data.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 hover:shadow-[0_0_25px_rgba(45,212,191,0.1)] transition-shadow duration-500"
          >
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-100">
              Trading Recommendations
            </h3>
            <p className="text-zinc-400">
              Receive personalized trading recommendations based on technical
              indicators and market sentiment analysis.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 hover:shadow-[0_0_25px_rgba(45,212,191,0.1)] transition-shadow duration-500"
          >
            <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-100">
              Risk Assessment
            </h3>
            <p className="text-zinc-400">
              Understand the risk profile of different cryptocurrencies and make
              investment decisions aligned with your risk tolerance.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 hover:shadow-[0_0_25px_rgba(45,212,191,0.1)] transition-shadow duration-500"
          >
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-100">
              Portfolio Tracking
            </h3>
            <p className="text-zinc-400">
              Monitor your cryptocurrency portfolio performance with intuitive
              visualizations and real-time updates.
            </p>
          </motion.div>
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          className="max-w-4xl mx-auto mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
              How SCAR Helps You
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Navigate the cryptocurrency market with confidence using our suite
              of powerful tools and insights.
            </p>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6 md:p-8">
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full p-3 flex items-center justify-center md:mt-1">
                  <span className="text-teal-400 font-bold text-lg">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-zinc-100">
                    Research & Discover
                  </h3>
                  <p className="text-zinc-400">
                    Use our comprehensive search and analysis tools to research
                    cryptocurrencies, understand market trends, and discover
                    promising investment opportunities.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-full p-3 flex items-center justify-center md:mt-1">
                  <span className="text-cyan-400 font-bold text-lg">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-zinc-100">
                    Analyze & Understand
                  </h3>
                  <p className="text-zinc-400">
                    Leverage our AI-powered analysis to understand complex
                    market data, technical indicators, and sentiment analysis in
                    simple, actionable terms.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full p-3 flex items-center justify-center md:mt-1">
                  <span className="text-indigo-400 font-bold text-lg">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-zinc-100">
                    Make Informed Decisions
                  </h3>
                  <p className="text-zinc-400">
                    Use our personalized recommendations and risk assessments to
                    make confident investment decisions aligned with your
                    financial goals.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full p-3 flex items-center justify-center md:mt-1">
                  <span className="text-purple-400 font-bold text-lg">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-zinc-100">
                    Track & Optimize
                  </h3>
                  <p className="text-zinc-400">
                    Monitor your portfolio performance, receive timely alerts,
                    and continuously optimize your investment strategy based on
                    market changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
              Ready to Navigate the Crypto Market?
            </h2>
            <p className="text-zinc-300 mb-8 max-w-2xl mx-auto">
              Join thousands of investors who are using SCAR to make smarter
              cryptocurrency investment decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button className="px-8 py-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white border-0 rounded-xl font-medium text-lg flex items-center gap-2 transition-all hover:shadow-[0_0_25px_rgba(45,212,191,0.3)]">
                  Create Your Account
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  className="px-8 py-6 bg-zinc-800/50 border-zinc-700/50 text-zinc-100 hover:bg-zinc-700/50 hover:text-teal-400 hover:border-teal-500/30 rounded-xl font-medium text-lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
