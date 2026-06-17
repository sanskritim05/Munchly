export const RMP_SEEN_POST_PROMPT_KEY = "rmp_seen_post_prompt";

export function hasSeenPostPrompt() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(RMP_SEEN_POST_PROMPT_KEY) === "true";
}

export function markPostPromptSeen() {
  if (typeof window === "undefined") return;
  localStorage.setItem(RMP_SEEN_POST_PROMPT_KEY, "true");
}
