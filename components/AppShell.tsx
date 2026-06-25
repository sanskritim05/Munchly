"use client";

import { usePathname } from "next/navigation";
import { isNavHidden } from "@/lib/nav-routes";
import { NavBar } from "@/components/NavBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !isNavHidden(pathname);

  return (
    <>
      <main
        className={
          showNav
            ? "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-nav"
            : "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        }
      >
        {children}
      </main>
      {showNav ? <NavBar /> : null}
    </>
  );
}
