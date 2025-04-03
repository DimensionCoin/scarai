import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "../globals.css";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import { UserProvider } from "@/providers/UserProvider";
import ClientLayoutWrapper from "@/components/shared/ClientLayoutWrapper";
import OracleButton from "@/components/shared/OracleButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SCAR",
  description: "Make more confident choices",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <UserProvider>
        <OracleButton>
          <html lang="en">
            <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900 text-zinc-100`}
            >
              {/* Global background gradients and decorative elements */}
              <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm -z-10"></div>
              <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-teal-600/5 rounded-full blur-3xl"></div>
              </div>

              <Toaster position="top-right" reverseOrder={false} />

              <ClientLayoutWrapper>
                <div className="flex flex-col min-h-screen relative z-0">
                  {/* Header always at the top */}
                  <Header />

                  {/* Main area */}
                  <div className="flex flex-1 w-full">
                    {/* Sidebar visible on md and larger screens */}
                    <aside className="hidden md:block">
                      <Sidebar />
                    </aside>

                    {/* Main Content Area with left margin on md+ screens */}
                    <main className="flex-1 w-full md:ml-50 overflow-auto p-3">
                      {children}
                    </main>
                  </div>
                </div>
              </ClientLayoutWrapper>
            </body>
          </html>
        </OracleButton>
      </UserProvider>
    </ClerkProvider>
  );
}
