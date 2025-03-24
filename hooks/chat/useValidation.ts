import { hasEnoughCredits } from "@/actions/user.actions";

export async function useValidation(userId: string, message: string) {
  if (!userId || !message) {
    return { error: "Invalid request" };
  }
  if (!(await hasEnoughCredits(userId, 2))) {
    return { error: "Insufficient credits" };
  }
  return null;
}

