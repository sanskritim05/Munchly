"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";

export function ShareCtaLinks({
  plateId,
  rateClassName,
  postClassName,
}: {
  plateId: string;
  rateClassName: string;
  postClassName: string;
}) {
  return (
    <div className="flex gap-3">
      <Link
        href={`/plate/${plateId}`}
        onClick={() => track("share_card_cta_clicked", { cta: "rate", plate_id: plateId })}
        className={rateClassName}
      >
        rate this plate
      </Link>
      <Link
        href="/post"
        onClick={() => track("share_card_cta_clicked", { cta: "post", plate_id: plateId })}
        className={postClassName}
      >
        post your own
      </Link>
    </div>
  );
}
