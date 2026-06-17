export const HIDDEN_NAV_PATHS = [
  "/",
  "/get-started",
  "/signin",
  "/signup",
  "/onboard",
  "/profile/settings",
  "/welcome",
];

export function isNavHidden(pathname: string) {
  return (
    HIDDEN_NAV_PATHS.includes(pathname) ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/admin/")
  );
}
