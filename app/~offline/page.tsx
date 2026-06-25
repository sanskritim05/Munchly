import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-page flex-col items-center justify-center px-page text-center">
      <h1 className="text-xl font-bold">You&apos;re offline</h1>
      <p className="mt-3 max-w-sm text-sm text-gray-400">
        Munchly needs an internet connection to load plates and ratings. Check your connection and
        try again.
      </p>
      <Link
        href="/swipe"
        className="mt-8 inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-hot px-6 py-3 text-sm font-bold"
      >
        Try again
      </Link>
    </div>
  );
}
