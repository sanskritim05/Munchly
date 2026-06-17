import Image from "next/image";

const ICONS = {
  flame: { src: "/icons/flame.png", alt: "Hot" },
  not: { src: "/icons/not.png", alt: "Not" },
  post: { src: "/icons/post.png", alt: "Post" },
  trophy: { src: "/icons/trophy.png", alt: "Trophy" },
  profile: { src: "/icons/profile.png", alt: "Profile" },
} as const;

export type AppIconKind = keyof typeof ICONS;

export function AppIcon({
  kind,
  size = 48,
  className = "",
}: {
  kind: AppIconKind;
  size?: number;
  className?: string;
}) {
  const { src, alt } = ICONS[kind];
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
