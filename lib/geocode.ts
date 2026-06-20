export interface GeoPlace {
  city: string;
  state: string;
  label: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoPlace | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Munchly/1.0 (food recommendations)" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
      };
    };

    const city =
      data.address?.city ?? data.address?.town ?? data.address?.village ?? "";
    const state = data.address?.state ?? "";

    if (!city && !state) return null;

    const label = [city, state].filter(Boolean).join(", ");
    return { city, state, label };
  } catch {
    return null;
  }
}
