"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  LANDING_CAROUSEL_MIN_TILES_PER_ROW,
  LANDING_CAROUSEL_PLATE_LIMIT,
  LANDING_CAROUSEL_ROW_COUNT,
  type LandingCarouselPlate,
} from "@/lib/landing-carousel";

function buildDenseRow(plates: LandingCarouselPlate[], minTiles = LANDING_CAROUSEL_MIN_TILES_PER_ROW) {
  if (plates.length === 0) return [];

  const row: LandingCarouselPlate[] = [];
  for (let index = 0; index < minTiles; index++) {
    row.push(plates[index % plates.length]);
  }

  return row;
}

function splitRows(plates: LandingCarouselPlate[], rowCount = LANDING_CAROUSEL_ROW_COUNT) {
  const buckets: LandingCarouselPlate[][] = Array.from({ length: rowCount }, () => []);

  plates.forEach((plate, index) => {
    buckets[index % rowCount].push(plate);
  });

  return buckets.map((bucket, index) => {
    const source = bucket.length > 0 ? bucket : plates;
    const offset = index % Math.max(source.length, 1);
    const rotated = [...source.slice(offset), ...source.slice(0, offset)];
    return buildDenseRow(rotated.length > 0 ? rotated : plates);
  });
}

function CarouselRow({
  plates,
  reverse = false,
  duration,
}: {
  plates: LandingCarouselPlate[];
  reverse?: boolean;
  duration: number;
}) {
  const reduceMotion = useReducedMotion();
  const loop = [...plates, ...plates, ...plates];

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <motion.div
        className="flex h-full w-max gap-1.5"
        animate={
          reduceMotion
            ? undefined
            : {
                x: reverse ? ["-33.333%", "0%"] : ["0%", "-33.333%"],
              }
        }
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {loop.map((plate, index) => (
          <div
            key={`${plate.id}-${index}`}
            className="relative h-full w-28 shrink-0 overflow-hidden rounded-md sm:w-36 md:w-44"
          >
            <Image
              src={plate.image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 128px, 192px"
              unoptimized
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function LandingPlateCarousel({
  initialPlates,
}: {
  initialPlates: LandingCarouselPlate[];
}) {
  const [plates, setPlates] = useState(initialPlates);

  const refreshPlates = useCallback(async () => {
    try {
      const res = await fetch("/api/landing/carousel", { cache: "no-store" });
      if (!res.ok) return;

      const data = (await res.json()) as { plates?: LandingCarouselPlate[] };
      if (data.plates?.length) {
        setPlates(data.plates);
      }
    } catch {
      // Ignore background refresh errors.
    }
  }, []);

  useEffect(() => {
    setPlates(initialPlates);
  }, [initialPlates]);

  useEffect(() => {
    const supabase = createBrowserClient();

    function addPlate(plate: { id: string; image_url: string | null; is_active?: boolean }) {
      if (plate.is_active === false || !plate.image_url) return;

      const image_url = plate.image_url;

      setPlates((prev) => {
        const next = [{ id: plate.id, image_url }, ...prev.filter((p) => p.id !== plate.id)];
        return next.slice(0, LANDING_CAROUSEL_PLATE_LIMIT);
      });
    }

    const channel = supabase
      .channel("landing-carousel-plates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "plates" },
        (payload) => {
          addPlate(payload.new as { id: string; image_url: string | null; is_active?: boolean });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "plates" },
        (payload) => {
          const row = payload.new as { id: string; image_url: string | null; is_active?: boolean };
          if (!row.is_active) {
            setPlates((prev) => prev.filter((plate) => plate.id !== row.id));
            return;
          }

          addPlate(row);
        }
      )
      .subscribe();

    const interval = window.setInterval(() => void refreshPlates(), 30_000);

    function onFocus() {
      void refreshPlates();
    }

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [refreshPlates]);

  if (plates.length === 0) {
    return (
      <div className="pointer-events-none absolute inset-0">
        <div className="h-full w-full animate-pulse bg-gradient-to-br from-hot/30 via-purple/15 to-black" />
      </div>
    );
  }

  const rows = splitRows(plates);
  const durations = [55, 68, 60, 72, 64, 70];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
      <div className="absolute inset-0 flex rotate-[-6deg] scale-[1.2] flex-col gap-1">
        {rows.map((row, index) => (
          <CarouselRow
            key={index}
            plates={row}
            reverse={index % 2 === 1}
            duration={durations[index] ?? 40}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
