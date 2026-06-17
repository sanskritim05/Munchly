import type { Metadata } from "next";
import Link from "next/link";
import { ShareAnalyticsTracker } from "@/components/ShareAnalyticsTracker";
import { ShareCtaLinks } from "@/components/ShareCtaLinks";
import { SharePlateCard } from "@/components/SharePlateCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { shareScoreColor } from "@/lib/share-card";

async function getPlate(id: string) {
  const supabase = createAdminClient();
  const { data: plate } = await supabase
    .from("plates")
    .select("*, profiles!plates_user_id_fkey(username)")
    .eq("id", id)
    .single();

  return plate;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const plate = await getPlate(params.id);
  const profile = Array.isArray(plate?.profiles) ? plate?.profiles[0] : plate?.profiles;
  const username = profile?.username ?? "foodie";
  const score = Number(plate?.score ?? 0).toFixed(1);
  const dishName = plate?.dish_name ?? "a plate";

  return {
    title: `@${username}'s ${dishName} scored ${score} | PlateCheck`,
    description: "Hot or not for food photos. Rate this plate or post your own.",
    openGraph: {
      title: `@${username}'s plate scored ${score}/10`,
      description: dishName,
      images: [`/share/${params.id}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: `@${username}'s plate scored ${score}/10`,
      description: dishName,
      images: [`/share/${params.id}/opengraph-image`],
    },
  };
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const plate = await getPlate(params.id);

  if (!plate) {
    return (
      <div className="flex min-h-app items-center justify-center bg-[#080808] px-6 text-center">
        <div>
          <p className="text-lg text-gray-400">This plate is gone.</p>
          <Link href="/get-started" className="mt-4 inline-block text-hot">
            Join PlateCheck →
          </Link>
        </div>
      </div>
    );
  }

  const profile = Array.isArray(plate.profiles) ? plate.profiles[0] : plate.profiles;
  const username = profile?.username ?? "foodie";
  const score = Number(plate.score);
  const scoreColor = shareScoreColor(score);

  return (
    <div className="min-h-app bg-[#080808] text-white">
      <ShareAnalyticsTracker plateId={params.id} score={score} />

      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-10 pt-8 sm:px-6">
        <p className="text-center text-sm uppercase tracking-[0.2em] text-[#666]">
          PlateCheck
        </p>

        <h1 className="text-center text-xl font-bold leading-snug text-[#f0ede6]">
          <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1">
            <span>@{username}&apos;s plate got a</span>
            <span className="tabular-nums" style={{ color: scoreColor }}>
              {score.toFixed(1)}
            </span>
          </span>
        </h1>

        <SharePlateCard
          imageUrl={plate.image_url}
          score={score}
          dishName={plate.dish_name ?? "Mystery Dish"}
          username={username}
          hotCount={plate.hot_count ?? 0}
          notCount={plate.not_count ?? 0}
        />

        <ShareCtaLinks
          plateId={params.id}
          rateClassName="flex-1 rounded-full bg-[#ff3c00] px-4 py-3.5 text-center text-base font-bold transition-transform hover:scale-[1.02]"
          postClassName="flex-1 rounded-full border border-[#222] bg-transparent px-4 py-3.5 text-center text-base font-bold text-[#f0ede6] transition-colors hover:border-[#333]"
        />

        <p className="text-center text-[13px] text-white">
          does your food look better than this? prove it.
        </p>
      </div>
    </div>
  );
}
