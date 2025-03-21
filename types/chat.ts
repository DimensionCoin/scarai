// @/types/chat.ts
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
