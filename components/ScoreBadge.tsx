import { scoreColor } from "@/lib/scores";

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const color = scoreColor(score);
  const sizeClass =
    size === "lg" ? "px-6 py-3 text-5xl" : size === "sm" ? "px-2 py-1 text-sm" : "px-4 py-2 text-2xl";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold text-white ${sizeClass}`}
      style={{ backgroundColor: color }}
    >
      {score.toFixed(1)}
    </span>
  );
}
