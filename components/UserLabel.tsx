import Link from "next/link";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { profileDisplayName, profileHandle } from "@/lib/profile-display";

export function UserLabel({
  username,
  displayName,
  verified = false,
  className = "",
  nameClassName = "font-semibold",
  handleClassName = "text-gray-400",
  href,
}: {
  username: string;
  displayName?: string | null;
  verified?: boolean;
  className?: string;
  nameClassName?: string;
  handleClassName?: string;
  href?: string;
}) {
  const name = profileDisplayName({ username, display_name: displayName });
  const content = (
    <span className={`inline-flex min-w-0 items-center gap-1 ${className}`}>
      {name ? (
        <>
          <span className={`inline-flex min-w-0 items-center gap-1 ${nameClassName}`}>
            <span className="truncate">{name}</span>
            {verified ? <VerifiedBadge size={14} className="shrink-0" /> : null}
          </span>
          <span className={`truncate ${handleClassName}`}> · {profileHandle(username)}</span>
        </>
      ) : (
        <span className={`inline-flex min-w-0 items-center gap-1 ${nameClassName}`}>
          <span className="truncate">{profileHandle(username)}</span>
          {verified ? <VerifiedBadge size={14} className="shrink-0" /> : null}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-0 max-w-full items-center">
        {content}
      </Link>
    );
  }

  return content;
}
