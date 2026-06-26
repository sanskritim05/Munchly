"use client";

import { usePathname } from "next/navigation";
import { isNavHidden } from "@/lib/nav-routes";
import { NavBar } from "@/components/NavBar";

function isFeedRoute(pathname: string) {
  return pathname.startsWith("/swipe");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !isNavHidden(pathname);
  const feedRoute = isFeedRoute(pathname);

  const mainClassName = feedRoute
    ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    : "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]";

  return (
    <>
      <main className={mainClassName}>{children}</main>
      {showNav ? <NavBar /> : null}
    </>
  );
}
