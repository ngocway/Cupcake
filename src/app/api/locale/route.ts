import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma, { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role || (session as any)?.role;
    const db = getPrisma(userRole);

    // 1. If logged in, check if user already has a saved locale in DB
    if (userId) {
      let dbUser = await db.user.findUnique({
        where: { id: userId },
        select: { locale: true },
      }).catch(() => null);

      if (!dbUser && db !== prisma) {
        dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { locale: true },
        }).catch(() => null);
      }

      if (dbUser?.locale && (dbUser.locale === "vi" || dbUser.locale === "en")) {
        const res = NextResponse.json({ locale: dbUser.locale, source: "db" });
        res.cookies.set("NEXT_LOCALE", dbUser.locale, { path: "/", maxAge: 31536000 });
        return res;
      }
    }

    // 1.5 Check cookie NEXT_LOCALE
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    if (cookieLocale && (cookieLocale === "vi" || cookieLocale === "en")) {
      return NextResponse.json({ locale: cookieLocale, source: "cookie" });
    }

    // 2. Check Geo headers (Vercel / Cloudflare / Proxies)
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-country-code");

    let detectedLocale: "vi" | "en" = "en";

    if (country) {
      detectedLocale = country.toUpperCase() === "VN" ? "vi" : "en";
    } else {
      // Fallback for Localhost / environments without geo headers
      const acceptLanguage = request.headers.get("accept-language") || "";
      if (acceptLanguage.toLowerCase().includes("vi")) {
        detectedLocale = "vi";
      } else {
        const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const ip = forwardedFor || (request as any).ip || "";
        const isLocal =
          !ip ||
          ip === "127.0.0.1" ||
          ip === "::1" ||
          ip.startsWith("192.168.") ||
          ip.startsWith("10.");

        if (!isLocal) {
          try {
            const geoRes = await fetch(`https://api.country.is/${ip}`, {
              signal: AbortSignal.timeout(1500),
            });
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData?.country === "VN") {
                detectedLocale = "vi";
              }
            }
          } catch (e) {
            // Ignore fetch timeout/errors and keep fallback
          }
        }
      }
    }

    // 3. If logged in and no locale in DB yet, auto-save initial detected locale
    if (userId) {
      try {
        await db.user.update({
          where: { id: userId },
          data: { locale: detectedLocale },
        });
      } catch (err) {
        if (db !== prisma) {
          await prisma.user.update({
            where: { id: userId },
            data: { locale: detectedLocale },
          }).catch(() => null);
        }
      }
    }

    const res = NextResponse.json({
      locale: detectedLocale,
      source: country ? "geo-header" : "fallback",
    });
    res.cookies.set("NEXT_LOCALE", detectedLocale, { path: "/", maxAge: 31536000 });
    return res;
  } catch (error) {
    console.error("Error detecting locale:", error);
    return NextResponse.json({ locale: "vi", source: "error-fallback" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { locale } = body;

    if (!locale || (locale !== "vi" && locale !== "en")) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const userId = session?.user?.id;
    if (userId) {
      const userRole = (session?.user as any)?.role || (session as any)?.role;
      const db = getPrisma(userRole);
      try {
        await db.user.update({
          where: { id: userId },
          data: { locale },
        });
      } catch (err) {
        if (db !== prisma) {
          await prisma.user.update({
            where: { id: userId },
            data: { locale },
          }).catch(() => null);
        }
      }
    }

    const res = NextResponse.json({ success: true, locale });
    res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000 });
    return res;
  } catch (error) {
    console.error("Error saving locale:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
