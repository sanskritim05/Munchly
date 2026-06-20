import Link from "next/link";
import { profileDisplayName, profileHandle } from "@/lib/profile-display";

export function UserLabel({
  username,
  displayName,
  className = "",
  nameClassName = "font-semibold",
  handleClassName = "text-gray-400",
  href,
}: {
  username: string;
  displayName?: string | null;
  className?: string;
  nameClassName?: string;
  handleClassName?: string;
  href?: string;
}) {
  const name = profileDisplayName({ username, display_name: displayName });
  const content = name ? (
    <>
      <span className={nameClassName}>{name}</span>
      <span className={handleClassName}> · {profileHandle(username)}</span>
    </>
  ) : (
    <span className={nameClassName}>{profileHandle(username)}</span>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <span className={className}>{content}</span>;
}
