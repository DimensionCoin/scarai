import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a custom Tailwind CSS breakpoint
 */
export function createTheme(breakpoint: string, minWidth: string) {
  if (typeof document !== "undefined") {
    const style = document.createElement("style");
    style.innerHTML = `
      @media ${minWidth} {
        .xs\\:p-2 { padding: 0.5rem; }
        .xs\\:gap-2 { gap: 0.5rem; }
        .xs\\:mr-2 { margin-right: 0.5rem; }
        .xs\\:h-6 { height: 1.5rem; }
        .xs\\:w-6 { width: 1.5rem; }
        .xs\\:text-\\[10px\\] { font-size: 10px; }
        .xs\\:text-\\[8px\\] { font-size: 8px; }
        .xs\\:text-\\[14px\\] { font-size: 14px; }
        .xs\\:text-xs { font-size: 0.75rem; line-height: 1rem; }
        .xs\\:max-w-\\[14px\\] { max-width: 14px; }
        .xs\\:h-2\\.5 { height: 0.625rem; }
        .xs\\:w-2\\.5 { width: 0.625rem; }
      }
    `;
    document.head.appendChild(style);
  }
}
