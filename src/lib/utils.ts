import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random 12-digit integer
 * @returns A random 12-digit integer as a string
 */
export function generateRandom12DigitId(): string {
  // Generate a random number between 100000000000 and 999999999999
  const min = 100000000000; // 12 digits starting with 1
  const max = 999999999999; // 12 digits ending with 9
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum.toString();
}
