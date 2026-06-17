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
            className="group relative aspect-square overflow-hidden rounded-xl"
          >
            <Image src={plate.image_url} alt="" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/40" />
            {isOwner && plate.dish_name ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                <p className="truncate text-xs font-bold">{plate.dish_name}</p>
                {plate.restaurant_name ? (
                  <p className="truncate text-[10px] text-gray-300">{plate.restaurant_name}</p>
                ) : null}
              </div>
            ) : null}
            <div className="absolute bottom-1 right-1">
              <ScoreBadge score={Number(plate.score)} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
