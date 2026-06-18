function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

function withHttps(url: string) {
  const normalized = normalizeBaseUrl(url);
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  return `https://${normalized}`;
}

export function getAppBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return withHttps(configured);

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionUrl) return withHttps(productionUrl);

  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_URL) {
    return withHttps(process.env.VERCEL_URL);
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
