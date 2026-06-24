import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  shareScoreColor,
  truncateRoast,
} from "@/lib/share-card";
import { profilePrimaryLabel } from "@/lib/profile-display";
import { getPlateTier } from "@/lib/tiers";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadSyneFont() {
  const response = await fetch(
    "https://cdn.jsdelivr.net/npm/@fontsource/syne@5.0.17/files/syne-latin-800-normal.woff"
  );
  if (!response.ok) {
    throw new Error("Failed to load Syne font");
  }
  return response.arrayBuffer();
}

export default async function OgImage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { data: plate } = await supabase
    .from("plates")
    .select(
      "score, dish_name, image_url, ai_roast, profiles!plates_user_id_fkey(username, display_name, average_score, total_plates)"
    )
    .eq("id", params.id)
    .single();

  const score = Number(plate?.score ?? 0);
  const profile = plate?.profiles as
    | { username: string; display_name: string | null; average_score: number; total_plates: number }
    | { username: string; display_name: string | null; average_score: number; total_plates: number }[]
    | null;
  const profileRow = Array.isArray(profile) ? profile[0] : profile;
  const username = profileRow?.username ?? "foodie";
  const ownerLabel = profilePrimaryLabel({
    username,
    display_name: profileRow?.display_name ?? null,
  });
  const dishName = plate?.dish_name ?? "Mystery Dish";
  const roast = truncateRoast(plate?.ai_roast);
  const scoreColor = shareScoreColor(score);
  const tierLabel = getPlateTier(
    Number(profileRow?.average_score ?? 0),
    profileRow?.total_plates ?? 0,
    username
  ).name;
  const imageUrl = plate?.image_url ?? null;

  const syneFont = await loadSyneFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#080808",
          position: "relative",
          fontFamily: "Syne",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "55%",
            display: "flex",
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#111111" }} />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.55) 45%, rgba(8,8,8,0) 100%)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 48px 72px",
            marginTop: 120,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                fontSize: 96,
                fontWeight: 800,
                color: scoreColor,
                lineHeight: 1,
              }}
            >
              {score.toFixed(1)}
            </span>
            <span
              style={{
                fontSize: 32,
                color: "#555555",
                marginLeft: 8,
                lineHeight: 1,
              }}
            >
              /10
            </span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#f0ede6",
              marginTop: 16,
              textAlign: "center",
              maxWidth: 900,
            }}
          >
            {dishName}
          </div>
          {roast ? (
            <div
              style={{
                fontSize: 18,
                fontStyle: "italic",
                color: "#666666",
                marginTop: 12,
                textAlign: "center",
                maxWidth: 820,
              }}
            >
              {roast}
            </div>
          ) : null}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 40px",
            fontSize: 18,
          }}
        >
          <span style={{ color: "#f0ede6", fontWeight: 700 }}>{ownerLabel}</span>
          <span style={{ color: "#c9c4bc", fontWeight: 700 }}>{tierLabel}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Syne",
          data: syneFont,
          style: "normal",
          weight: 800,
        },
      ],
    }
  );
}
