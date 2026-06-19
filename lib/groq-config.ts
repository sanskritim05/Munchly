import Groq from "groq-sdk";

/**
 * Best-quality Groq model on the free tier (no credit card).
 * Used only for profile taste picks.
 */
export const GROQ_TASTE_PICKS_MODEL =
  process.env.GROQ_TASTE_PICKS_MODEL?.trim() || "llama-3.3-70b-versatile";

export function hasGroqKey() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export function createGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! });
}
