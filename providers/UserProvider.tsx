"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getUser } from "@/actions/user.actions";

type SubscriptionTier = "free" | "basic" | "premium";

type UserContextType = {
  isAuthenticated: boolean;
  tier: SubscriptionTier;
  credits: number; 
};

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [credits, setCredits] = useState<number>(10); // Default to 10 until fetched

  useEffect(() => {
    if (isLoaded && user) {
      getUser(user.id)
        .then((data) => {
          if (data) {
            setTier(data.subscriptionTier || "free");
            setCredits(data.credits ?? 10); 
          }
        })
        .catch((error) => {
          console.error("Failed to fetch user data:", error);
        });
    }
  }, [isLoaded, user]);

  return (
    <UserContext.Provider
      value={{
        isAuthenticated: !!user,
        tier,
        credits, // Expose credits to the app
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
