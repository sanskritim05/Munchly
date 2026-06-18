"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { PlateEditForm } from "@/components/PlateEditForm";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreMilestoneLayer } from "@/components/ScoreMilestoneOverlay";
import { PlatePresenceIndicator } from "@/components/PlatePresenceIndicator";
import { useAuth } from "@/components/AuthProvider";
import {
  getNewMilestoneCelebration,
  markMilestonesShown,
  type MilestoneCelebration,
} from "@/lib/score-milestones";
import { createBrowserClient } from "@/lib/supabase/client";

interface Plate {
  id: string;
  user_id: string;
  image_url: string;
  dish_name: string | null;
  restaurant_name: string | null;
  score: number;
  hot_count: number;
  not_count: number;
  caption: string | null;
  profiles: { username: string } | { username: string }[] | null;
}

interface Comment {
  id: string;
  content: string;
  parent_id: string | null;
  like_count: number;
  user_id: string;
  profiles: { username: string } | { username: string }[] | null;
  liked_by_me?: boolean;
}

function commentUsername(c: Comment): string {
  const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
  return p?.username ?? "foodie";
}

export function PlateView({
  plateId,
  onBack,
  backLabel = "Back",
}: {
  plateId: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  const router = useRouter();
  const { user, getAccessToken } = useAuth();
  const [plate, setPlate] = useState<Plate | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [celebration, setCelebration] = useState<MilestoneCelebration | null>(null);
  const [scorePulse, setScorePulse] = useState(false);
  const prevScoreRef = useRef<number | null>(null);
  const skipInitialScoreRef = useRef(true);

  const isOwner = Boolean(user && plate && user.id === plate.user_id);

  useEffect(() => {
    skipInitialScoreRef.current = true;
    prevScoreRef.current = null;
    setCelebration(null);
    setScorePulse(false);
  }, [plateId]);

  useEffect(() => {
    if (!plate) return;

    const score = Number(plate.score);

    if (skipInitialScoreRef.current) {
      skipInitialScoreRef.current = false;
      prevScoreRef.current = score;
      return;
    }

    const prev = prevScoreRef.current;
    if (prev === null || score === prev) return;

    setScorePulse(true);

    const nextCelebration = getNewMilestoneCelebration(prev, score, plateId);
    if (nextCelebration) {
      setCelebration(nextCelebration);
    }

    prevScoreRef.current = score;
  }, [plate?.score, plateId, plate]);

  function dismissCelebration() {
    if (celebration) {
      markMilestonesShown(plateId, celebration.markShown);
      setCelebration(null);
    }
  }

  useEffect(() => {
    const supabase = createBrowserClient();

    async function load() {
      const { data } = await supabase
        .from("plates")
        .select("*, profiles!plates_user_id_fkey(username)")
        .eq("id", plateId)
        .eq("is_active", true)
        .maybeSingle();

      if (data) setPlate(data as Plate);

      const { data: cmts } = await supabase
        .from("comments")
        .select("id, content, parent_id, like_count, user_id, profiles!comments_user_id_fkey(username)")
        .eq("plate_id", plateId)
        .order("created_at", { ascending: true });

      const list = (cmts as Comment[]) ?? [];

      if (user) {
        const { data: likes } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", user.id)
          .in(
            "comment_id",
            list.length ? list.map((c) => c.id) : ["00000000-0000-0000-0000-000000000000"]
          );

        const liked = new Set((likes ?? []).map((l) => l.comment_id));
        setComments(list.map((c) => ({ ...c, like_count: c.like_count ?? 0, liked_by_me: liked.has(c.id) })));
      } else {
        setComments(list.map((c) => ({ ...c, like_count: c.like_count ?? 0 })));
      }
    }

    load();

    const channel = supabase
      .channel(`plate-${plateId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "plates", filter: `id=eq.${plateId}` },
        (payload) =>
          setPlate((p) => {
            if (!p) return p;
            const next = payload.new as Partial<Plate>;
            return {
              ...p,
              ...next,
              score: Number(next.score ?? p.score),
              hot_count: Number(next.hot_count ?? p.hot_count),
              not_count: Number(next.not_count ?? p.not_count),
            };
          })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [plateId, user?.id]);

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !comment.trim()) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plate_id: plateId, content: comment }),
    });

    if (res.ok) {
      setComment("");
      const data = await res.json();
      setComments((c) => [
        ...c,
        { ...data.comment, parent_id: null, like_count: 0, liked_by_me: false },
      ]);
    }
  }

  async function submitReply(parentId: string) {
    const token = getAccessToken();
    if (!token || !replyText.trim()) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plate_id: plateId, content: replyText, parent_id: parentId }),
    });

    if (res.ok) {
      const data = await res.json();
      setComments((c) => [
        ...c,
        { ...data.comment, like_count: 0, liked_by_me: false },
      ]);
      setReplyText("");
      setReplyingTo(null);
    }
  }

  async function toggleLike(commentId: string) {
    const token = getAccessToken();
    if (!token) return;

    const res = await fetch(`/api/comments/${commentId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, like_count: data.like_count, liked_by_me: data.liked }
            : c
        )
      );
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    const token = getAccessToken();
    if (!token) return;

    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setComments((prev) => {
        const toRemove = new Set<string>([commentId]);
        prev.forEach((c) => {
          if (c.parent_id === commentId) toRemove.add(c.id);
        });
        return prev.filter((c) => !toRemove.has(c.id));
      });
    }
  }

  async function savePlateEdit(data: { dish_name: string; restaurant_name: string }) {
    const token = getAccessToken();
    if (!token) throw new Error("Not signed in");

    const res = await fetch(`/api/plates/${plateId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to save");

    setPlate((p) =>
      p ? { ...p, dish_name: body.plate.dish_name, restaurant_name: body.plate.restaurant_name } : p
    );
    setEditing(false);
  }

  async function deletePlate() {
    if (!confirm("Delete this plate? This cannot be undone.")) return;
    const token = getAccessToken();
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/plates/${plateId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const profile = Array.isArray(plate?.profiles) ? plate.profiles[0] : plate?.profiles;
        const destination = profile?.username ? `/profile/${profile.username}` : "/swipe";
        router.replace(destination);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  if (!plate) {
    return (
      <div className="flex min-h-page items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const profile = Array.isArray(plate.profiles) ? plate.profiles[0] : plate.profiles;
  const total = plate.hot_count + plate.not_count;
  const hotPct = total > 0 ? (plate.hot_count / total) * 100 : 50;
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  function OwnerCommentActions({ c }: { c: Comment }) {
    if (!isOwner) return null;
    return (
      <div className="mt-2 flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => toggleLike(c.id)}
          className={`inline-flex items-center gap-1 font-medium ${
            c.liked_by_me ? "text-hot" : "text-gray-400 hover:text-hot"
          }`}
        >
          <span aria-hidden>{c.liked_by_me ? "♥" : "♡"}</span>
          {c.like_count > 0 ? c.like_count : "Like"}
        </button>
        {!c.parent_id ? (
          <button
            type="button"
            onClick={() => {
              setReplyingTo(replyingTo === c.id ? null : c.id);
              setReplyText("");
            }}
            className="font-medium text-gray-400 hover:text-purple"
          >
            Reply
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => deleteComment(c.id)}
          className="font-medium text-gray-400 hover:text-red-400"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <>
      <ScoreMilestoneLayer celebration={celebration} onDismiss={dismissCelebration} />

      <div className="app-container px-page pb-page pt-4">
      {onBack && !isOwner ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-3 text-sm text-gray-400 hover:text-white"
        >
          ← {backLabel}
        </button>
      ) : null}
      {isOwner ? (
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={profile?.username ? `/profile/${profile.username}` : "/swipe"}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back to your profile
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-full border border-border px-3 py-1 text-xs font-bold"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={deletePlate}
              disabled={deleting}
              className="rounded-full border border-red-500/50 px-3 py-1 text-xs font-bold text-red-400 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative aspect-square overflow-hidden rounded-2xl">
        <Image src={plate.image_url} alt="" fill className="object-cover" unoptimized />
      </div>

      {editing ? (
        <PlateEditForm
          dishName={plate.dish_name ?? ""}
          restaurantName={plate.restaurant_name ?? ""}
          onSave={savePlateEdit}
          onCancel={() => setEditing(false)}
        />
      ) : null}

      <div className="mt-6 flex flex-col items-center gap-3">
        <motion.div
          animate={scorePulse ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, times: [0, 0.45, 1] }}
          onAnimationComplete={() => setScorePulse(false)}
        >
          <ScoreBadge score={Number(plate.score)} size="lg" />
        </motion.div>
        {profile?.username ? (
          <Link
            href={`/profile/${profile.username}`}
            className="text-purple transition-colors hover:text-hot hover:underline"
          >
            @{profile.username}
          </Link>
        ) : (
          <p className="text-gray-400">@foodie</p>
        )}
        <h1 className="text-2xl font-bold">{plate.dish_name ?? "Plate"}</h1>
        {plate.restaurant_name ? (
          <p className="text-gray-400">{plate.restaurant_name}</p>
        ) : null}
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface">
        <div className="flex h-full">
          <div className="bg-hot" style={{ width: `${hotPct}%` }} />
          <div className="bg-gray-700" style={{ width: `${100 - hotPct}%` }} />
        </div>
      </div>
      <p className="mt-1 flex items-center justify-center gap-3 text-sm text-gray-400">
        <span className="inline-flex items-center gap-1">
          <AppIcon kind="flame" size={18} />
          {plate.hot_count} hot
        </span>
        <span className="text-gray-600">·</span>
        <span className="inline-flex items-center gap-1">
          <AppIcon kind="not" size={18} />
          {plate.not_count} not
        </span>
      </p>
      <PlatePresenceIndicator plateId={plateId} />

      <div className="mt-6 flex gap-3">
        <a
          href={`/share/${plateId}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-full bg-hot py-3 text-center font-bold"
        >
          Share score card
        </a>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-full border border-border py-3 text-center font-bold"
          >
            Back to feed
          </button>
        ) : (
          <Link
            href="/swipe"
            className="flex-1 rounded-full border border-border py-3 text-center font-bold"
          >
            Rate more
          </Link>
        )}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-bold">Comments</h2>
        {user ? (
          <form onSubmit={submitComment} className="mb-4 flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Say something..."
              className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm"
            />
            <button type="submit" className="rounded-full bg-purple px-4 py-2 text-sm font-bold">
              Post
            </button>
          </form>
        ) : null}
        <ul className="space-y-3">
          {topLevel.map((c) => (
            <li key={c.id} className="rounded-xl bg-surface p-3 text-sm">
              <span className="font-bold text-purple">@{commentUsername(c)}</span> {c.content}
              <OwnerCommentActions c={c} />
              {replyingTo === c.id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => submitReply(c.id)}
                    disabled={!replyText.trim()}
                    className="rounded-full bg-purple px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="rounded-full border border-border px-2 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
              {(repliesByParent[c.id] ?? []).length > 0 ? (
                <ul className="mt-3 space-y-2 border-l-2 border-border pl-3">
                  {(repliesByParent[c.id] ?? []).map((reply) => (
                    <li key={reply.id}>
                      <span className="font-bold text-purple">@{commentUsername(reply)}</span>{" "}
                      {reply.content}
                      <OwnerCommentActions c={reply} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet.</p>
        ) : null}
      </section>
      </div>
    </>
  );
}
