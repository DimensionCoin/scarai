"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getUser } from "@/actions/user.actions";

type SubscriptionTier = "free" | "basic" | "premium";

type UserContextType = {
  isAuthenticated: boolean;
  tier: SubscriptionTier;
  credits: number;
  createdAt: string | null;
  isContextLoaded: boolean; // New property to track if context data is loaded
};

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [credits, setCredits] = useState<number>(20); 
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [isContextLoaded, setIsContextLoaded] = useState<boolean>(false);

  useEffect(() => {
    // If Clerk hasn't loaded yet, we're not ready
    if (!isLoaded) {
      setIsContextLoaded(false);
      return;
    }

    // If no user is logged in, we're still "loaded" (just with default values)
    if (!user) {
      setIsContextLoaded(true);
      return;
    }

    // Fetch user data from your backend
    getUser(user.id)
      .then((data) => {
        if (data) {
          setTier(data.subscriptionTier || "free");
          setCredits(data.credits ?? 20);
          setCreatedAt(data.createdAt);
        }
        // Mark context as loaded regardless of whether we got data
        setIsContextLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to fetch user data:", error);
        // Even on error, we should mark as loaded to prevent infinite loading states
        setIsContextLoaded(true);
      });
  }, [isLoaded, user]);

  return (
    <UserContext.Provider
      value={{
        isAuthenticated: !!user,
        tier,
        credits,
        createdAt,
        isContextLoaded, // Include the new flag in the context value
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
