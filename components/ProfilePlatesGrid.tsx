"use client";

import Image from "next/image";
import Link from "next/link";
import { ScoreBadge } from "@/components/ScoreBadge";
import { useAuth } from "@/components/AuthProvider";

interface PlateItem {
  id: string;
  image_url: string;
  score: number;
  dish_name: string | null;
  restaurant_name?: string | null;
}

export function ProfilePlatesGrid({
  profileUserId,
  plates,
}: {
  profileUserId: string;
  plates: PlateItem[];
}) {
  const { user } = useAuth();
  const isOwner = user?.id === profileUserId;

  if (!plates.length) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-gray-400">
          {isOwner ? "No plates yet. Post your first one!" : "No plates yet."}
        </p>
        {isOwner ? (
          <Link href="/post" className="mt-3 inline-block text-sm font-bold text-hot">
            Post a plate
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 font-bold">{isOwner ? "Your plates" : "Plates"}</h2>
      <div className="grid grid-cols-3 gap-2">
        {plates.map((plate) => (
          <Link
            key={plate.id}
            href={`/plate/${plate.id}`}
            className="group relative aspect-square overflow-hidden rounded-xl bg-surface"
          >
            <Image src={plate.image_url} alt="" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-2">
              <ScoreBadge score={Number(plate.score)} size="sm" />
              {plate.restaurant_name ? (
                <p className="mt-1 truncate text-xs font-bold leading-tight text-white">
                  {plate.restaurant_name}
                </p>
              ) : null}
              {plate.dish_name ? (
                <p className="truncate text-[10px] leading-tight text-gray-300">
                  {plate.dish_name}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
