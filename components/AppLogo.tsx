import Image from "next/image";

export const APP_LOGO_SRC = "/logo.png";

const LOGO_ASPECT = 471 / 529;

export function AppLogo({
  size = 140,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const height = Math.round(size * LOGO_ASPECT);

  return (
    <Image
      src={APP_LOGO_SRC}
      alt="Plate Check"
      width={size}
      height={height}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}
