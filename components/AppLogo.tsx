import Image from "next/image";
import Link from "next/link";

export const APP_LOGO_SRC = "/logo.png?v=7";

const LOGO_ASPECT = 292 / 624;

export function AppLogo({
  size = 140,
  className = "",
  priority = false,
  href = "/",
}: {
  size?: number;
  className?: string;
  priority?: boolean;
  href?: string | null;
}) {
  const height = Math.round(size * LOGO_ASPECT);

  const image = (
    <Image
      src={APP_LOGO_SRC}
      alt="Munchly"
      width={size}
      height={height}
      priority={priority}
      className="object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
    />
  );

  if (!href) {
    return <span className={`block w-fit ${className}`}>{image}</span>;
  }

  return (
    <Link
      href={href}
      className={`block w-fit transition-opacity hover:opacity-90 ${className}`}
      aria-label="Munchly home"
    >
      {image}
    </Link>
  );
}
