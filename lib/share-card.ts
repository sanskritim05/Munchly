import { getPlateTier } from "@/lib/tiers";
import { shareScoreColor } from "@/lib/scores";

export function truncateRoast(text: string | null | undefined, max = 60) {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
}

export function getShareTierLabel(score: number) {
  return getPlateTier(score, 1).name;
}

export { shareScoreColor };
