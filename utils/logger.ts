export const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ""),
  error: (msg: string, error?: any) =>
    console.error(`[ERROR] ${msg}`, error || ""),
};
