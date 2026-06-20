export const SCORE_MILESTONES = [7, 8, 9, 9.5] as const;

export type ScoreMilestone = (typeof SCORE_MILESTONES)[number];

export interface MilestoneCelebration {
  score: number;
  milestone: ScoreMilestone;
  color: string;
  text: string;
  markShown: ScoreMilestone[];
}

function storageKey(plateId: string) {
  return `munchly-milestones-${plateId}`;
}

export function getShownMilestones(plateId: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(plateId));
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function markMilestonesShown(plateId: string, milestones: number[]) {
  if (typeof window === "undefined" || !milestones.length) return;
  const shown = new Set(getShownMilestones(plateId));
  milestones.forEach((m) => shown.add(m));
  localStorage.setItem(storageKey(plateId), JSON.stringify(Array.from(shown)));
}

export function getMilestoneCelebrationConfig(score: number): {
  color: string;
  text: string;
} {
  if (score >= 9.5) {
    return { color: "#ff3c00", text: "absolute cinema" };
  }
  if (score >= 9) {
    return { color: "#f59e0b", text: "holy wow" };
  }
  if (score >= 8) {
    return { color: "#a855f7", text: "lowkey a banger" };
  }
  return { color: "#3b82f6", text: "not bad ngl" };
}

export function getNewMilestoneCelebration(
  prevScore: number,
  nextScore: number,
  plateId: string
): MilestoneCelebration | null {
  if (nextScore <= prevScore) return null;

  const shown = new Set(getShownMilestones(plateId));
  const newlyCrossed = SCORE_MILESTONES.filter(
    (m) => prevScore < m && nextScore >= m && !shown.has(m)
  ) as ScoreMilestone[];

  if (!newlyCrossed.length) return null;

  const milestone = Math.max(...newlyCrossed) as ScoreMilestone;
  const { color, text } = getMilestoneCelebrationConfig(nextScore);

  return { score: nextScore, milestone, color, text, markShown: newlyCrossed };
}
