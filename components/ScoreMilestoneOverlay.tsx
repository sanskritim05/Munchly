"use client";

import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useEffect, useMemo } from "react";
import type { MilestoneCelebration } from "@/lib/score-milestones";

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4,
    distance: 90 + Math.random() * 110,
    size: 4 + Math.random() * 4,
  }));
}

export function ScoreMilestoneOverlay({
  celebration,
  onDismiss,
}: {
  celebration: MilestoneCelebration;
  onDismiss: () => void;
}) {
  const [scope, animate] = useAnimate();
  const particles = useMemo(() => makeParticles(24), []);

  useEffect(() => {
    let cancelled = false;

    async function burst() {
      await Promise.all(
        particles.map((p) => {
          const x = Math.cos(p.angle) * p.distance;
          const y = Math.sin(p.angle) * p.distance;
          return animate(
            `#milestone-particle-${p.id}`,
            { x, y, opacity: [1, 0.8, 0], scale: [1, 1.1, 0.4] },
            { duration: 0.85, ease: "easeOut" }
          );
        })
      );

      if (!cancelled) {
        particles.forEach((p) => {
          void animate(
            `#milestone-particle-${p.id}`,
            { x: 0, y: 0, opacity: 0, scale: 0 },
            { duration: 0 }
          );
        });
      }
    }

    void burst();

    return () => {
      cancelled = true;
    };
  }, [animate, particles, celebration.score]);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] flex cursor-pointer items-center justify-center border-0 bg-black/88 p-0"
      onClick={onDismiss}
      aria-label="Dismiss celebration"
    >
      <div ref={scope} className="relative flex flex-col items-center px-6">
        {particles.map((p) => (
          <span
            key={p.id}
            id={`milestone-particle-${p.id}`}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: celebration.color,
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative z-10 text-8xl font-black tabular-nums leading-none"
          style={{ color: celebration.color }}
        >
          {celebration.score.toFixed(1)}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.25 }}
          className="relative z-10 mt-5 text-2xl font-bold lowercase text-white"
        >
          {celebration.text}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.35 }}
          className="relative z-10 mt-8 text-xs text-gray-400"
        >
          Tap anywhere to dismiss
        </motion.p>
      </div>
    </motion.button>
  );
}

export function ScoreMilestoneLayer({
  celebration,
  onDismiss,
}: {
  celebration: MilestoneCelebration | null;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {celebration ? (
        <ScoreMilestoneOverlay key={celebration.milestone} celebration={celebration} onDismiss={onDismiss} />
      ) : null}
    </AnimatePresence>
  );
}
