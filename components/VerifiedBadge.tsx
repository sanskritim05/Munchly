import Image from "next/image";

export function VerifiedBadge({
  className = "",
  size = 14,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/icons/verified.png?v=3"
      alt="Verified"
      width={size}
      height={size}
      className={`inline-block shrink-0 align-middle object-contain ${className}`}
    />
  );
}
