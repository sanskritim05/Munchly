export function calculateScore(hotCount: number, notCount: number) {
  const total = hotCount + notCount;
  if (total === 0) return 0;
  return Math.round((hotCount / total) * 100) / 10;
}

export function scoreColor(score: number) {
  if (score >= 8) return "#ff4d4d";
  if (score >= 6) return "#f59e0b";
  if (score >= 4) return "#6b7280";
  return "#374151";
}

export function shareScoreColor(score: number) {
  if (score >= 9) return "#ff3c00";
  if (score >= 7) return "#f59e0b";
  if (score >= 5) return "#a855f7";
  return "#6b7280";
}

