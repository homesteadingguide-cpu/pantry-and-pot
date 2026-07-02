import { NextRequest, NextResponse } from "next/server";
import { setDefaultResultOrder } from "dns";
import { db } from "@/lib/db";

// Some sandboxes have broken IPv6 routing — prefer IPv4 for outbound DNS.
setDefaultResultOrder("ipv4first");

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

interface NominatimResult {
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  addresstype?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
}

interface OMCurrent {
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m?: number;
  relative_humidity_2m?: number;
}

interface OMResponse {
  current?: OMCurrent;
  error?: boolean;
  reason?: string;
}

// WMO weather code -> { label, icon-key } — kept short on purpose
// Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear", icon: "Sun" },
  1: { label: "Mostly clear", icon: "Sun" },
  2: { label: "Partly cloudy", icon: "CloudSun" },
  3: { label: "Overcast", icon: "Cloud" },
  45: { label: "Fog", icon: "CloudFog" },
  48: { label: "Rime fog", icon: "CloudFog" },
  51: { label: "Light drizzle", icon: "CloudDrizzle" },
  53: { label: "Drizzle", icon: "CloudDrizzle" },
  55: { label: "Heavy drizzle", icon: "CloudDrizzle" },
  56: { label: "Freezing drizzle", icon: "CloudDrizzle" },
  57: { label: "Freezing drizzle", icon: "CloudDrizzle" },
  61: { label: "Light rain", icon: "CloudRain" },
  63: { label: "Rain", icon: "CloudRain" },
  65: { label: "Heavy rain", icon: "CloudRain" },
  66: { label: "Freezing rain", icon: "CloudRain" },
  67: { label: "Freezing rain", icon: "CloudRain" },
  71: { label: "Light snow", icon: "CloudSnow" },
  73: { label: "Snow", icon: "CloudSnow" },
  75: { label: "Heavy snow", icon: "CloudSnow" },
  77: { label: "Snow grains", icon: "CloudSnow" },
  80: { label: "Rain showers", icon: "CloudRain" },
  81: { label: "Rain showers", icon: "CloudRain" },
  82: { label: "Heavy showers", icon: "CloudRain" },
  85: { label: "Snow showers", icon: "CloudSnow" },
  86: { label: "Heavy snow showers", icon: "CloudSnow" },
  95: { label: "Thunderstorm", icon: "CloudLightning" },
  96: { label: "Thunderstorm + hail", icon: "CloudLightning" },
  99: { label: "Thunderstorm + hail", icon: "CloudLightning" },
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search");

  // Geocoding lookup: ?search=city-name (uses Nominatim / OpenStreetMap — free, no API key)
  if (search) {
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      search,
    )}&format=json&limit=5&addressdetails=1`;
    try {
      const r = await fetch(geoUrl, {
        cache: "no-store",
        headers: {
          // Nominatim requires a User-Agent identifying the app.
          "User-Agent": "Hearthstead/1.0 (apartment-homestead-app)",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) {
        return NextResponse.json(
          { error: `geocoding failed: ${r.status}` },
          { status: 502 },
        );
      }
      const data = (await r.json()) as NominatimResult[];
      const results = (Array.isArray(data) ? data : []).map((g) => {
        const a = g.address ?? {};
        const name =
          g.name || a.city || a.town || a.village || g.display_name?.split(",")[0] || "Unknown";
        const parts = [name, a.state || a.region, a.country].filter(Boolean);
        return {
          label: parts.join(", "),
          lat: Number(g.lat),
          lon: Number(g.lon),
        };
      });
      return NextResponse.json(results);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "geocoding error" },
        { status: 500 },
      );
    }
  }

  // Otherwise: fetch current weather for the stored location
  const row = await db.setting.findUnique({ where: { key: "location" } });
  let loc = { label: "Auckland", lat: -36.8485, lon: 174.7633 };
  if (row) {
    try {
      loc = JSON.parse(row.value);
    } catch {
      /* keep default */
    }
  }

  const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m`;
  try {
    const r = await fetch(omUrl, { cache: "no-store" });
    if (!r.ok) {
      return NextResponse.json(
        { error: `weather fetch failed: ${r.status}` },
        { status: 502 },
      );
    }
    const data = (await r.json()) as OMResponse;
    if (!data.current) {
      return NextResponse.json(
        { error: data.reason || "no current weather" },
        { status: 502 },
      );
    }
    const wmo = WMO[data.current.weather_code] ?? { label: "Unknown", icon: "Cloud" };
    return NextResponse.json({
      location: loc.label,
      temperature: Math.round(data.current.temperature_2m),
      condition: wmo.label,
      icon: wmo.icon,
      humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "weather fetch error" },
      { status: 500 },
    );
  }
}
