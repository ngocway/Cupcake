import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GEO_HEADER_KEYS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "x-geo-country",
];

function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (!code || code === "XX" || code === "T1" || code.length !== 2) return null;
  return code;
}

function isLocalIp(ip: string): boolean {
  return (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd")
  );
}

export async function GET(request: NextRequest) {
  for (const key of GEO_HEADER_KEYS) {
    const code = normalizeCountryCode(request.headers.get(key));
    if (code) {
      return NextResponse.json({
        country: code,
        isVietnam: code === "VN",
        source: "geo-header",
      });
    }
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const clientIp = forwardedFor || realIp || "";

  try {
    const endpoint = isLocalIp(clientIp)
      ? "https://api.country.is/"
      : `https://api.country.is/${encodeURIComponent(clientIp)}`;
    const geoRes = await fetch(endpoint, {
      signal: AbortSignal.timeout(1800),
      cache: "no-store",
    });
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const code = normalizeCountryCode(geoData?.country);
      if (code) {
        return NextResponse.json({
          country: code,
          isVietnam: code === "VN",
          source: "ip-lookup",
        });
      }
    }
  } catch {
    // Timeout or external lookup blocked
  }

  return NextResponse.json({
    country: null,
    isVietnam: false,
    source: "unknown",
  });
}
