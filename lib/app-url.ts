function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

export function getAppBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return normalizeBaseUrl(configured);

  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_URL) {
    return `https://${normalizeBaseUrl(process.env.VERCEL_URL)}`;
  }

  return null;
}

export function sharePlateUrl(plateId: string) {
  const base = getAppBaseUrl() ?? "http://localhost:3000";
  return `${base}/share/${plateId}`;
}

export function absoluteAppPath(path: string) {
  const base = getAppBaseUrl();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
