"use client";

import type React from "react";

import { useUserContext } from "@/providers/UserProvider";
import { useUser } from "@clerk/nextjs";
import LoadingScreen from "./LoadingScreen";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useUser();
  const { isContextLoaded } = useUserContext();

  // Show loading screen if either user or context data is not loaded
  if (!isLoaded || !isContextLoaded) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
