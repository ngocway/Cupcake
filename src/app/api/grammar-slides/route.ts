import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import {
  SLIDE_ASSET_VERSION,
  getUnitLectureManifestUrl,
  hasUnitLectureSlides,
} from "@/data/global-success-grammar/lecture-slides";

const manifestCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = process.env.NODE_ENV === "development" ? 15_000 : 3_600_000;

function fetchJsonIpv4(url: string, timeoutMs = 5000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        family: 4,
        timeout: timeoutMs,
        headers: {
          "User-Agent": "Dolcake-NextServer/1.0",
          Accept: "application/json",
        },
      },
      (res) => {
        const status = res.statusCode || 0;
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (status < 200 || status >= 300) {
            reject(new Error(`CDN status ${status}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error("CDN request timeout"));
    });
    req.on("error", reject);
  });
}

async function fetchManifestFromR2(grade: number, unit: number): Promise<unknown | null> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const bucket = process.env.R2_BUCKET_NAME || "cupcake-media";
  const key = `global-success/grammar-slides/g${grade}/u${unit}/manifest.json`;
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const text = await obj.Body?.transformToString("utf8");
  return text ? JSON.parse(text) : null;
}

function readLocalManifestFallback(grade: number, unit: number): unknown | null {
  const padded = String(unit).padStart(2, "0");
  const candidates = [
    grade === 3 && unit === 1
      ? path.resolve("slides/grade3-unit1-hello/manifest.json")
      : "",
    grade === 3 && unit >= 2
      ? path.resolve(`slides/grade3-units/g3-u${padded}/manifest.json`)
      : "",
    [1, 2, 4, 5].includes(grade)
      ? path.resolve(`slides/primary-units/g${grade}-u${padded}/manifest.json`)
      : "",
    grade >= 6
      ? path.resolve(`slides/upper-units/g${grade}-u${padded}/manifest.json`)
      : "",
  ].filter(Boolean);

  for (const fp of candidates) {
    if (fs.existsSync(fp)) {
      return JSON.parse(fs.readFileSync(fp, "utf8"));
    }
  }
  return null;
}

async function loadManifestReliable(grade: number, unit: number): Promise<unknown | null> {
  const cacheKey = `${grade}-${unit}-${SLIDE_ASSET_VERSION}`;
  const cached = manifestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const cdnUrl = getUnitLectureManifestUrl(grade, unit);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await fetchJsonIpv4(cdnUrl, 4500);
      manifestCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    } catch {
      // Retry CDN once over IPv4 before R2 S3 fallback
    }
  }

  try {
    const r2Data = await fetchManifestFromR2(grade, unit);
    if (r2Data) {
      manifestCache.set(cacheKey, { data: r2Data, expiresAt: Date.now() + CACHE_TTL_MS });
      return r2Data;
    }
  } catch (err) {
    console.warn("[GET /api/grammar-slides] R2 S3 fallback failed:", err);
  }

  const localData = readLocalManifestFallback(grade, unit);
  if (localData) {
    manifestCache.set(cacheKey, { data: localData, expiresAt: Date.now() + CACHE_TTL_MS });
    return localData;
  }

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = parseInt(searchParams.get("grade") || "", 10);
  const unit = parseInt(searchParams.get("unit") || "", 10);

  if (!Number.isFinite(grade) || !Number.isFinite(unit) || !hasUnitLectureSlides(grade, unit)) {
    return NextResponse.json({ error: "Slide deck not found" }, { status: 404 });
  }

  try {
    const manifest = await loadManifestReliable(grade, unit);
    if (!manifest) {
      return NextResponse.json({ error: "Failed to load slide manifest" }, { status: 502 });
    }
    return NextResponse.json(manifest, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("[GET /api/grammar-slides] Error:", err);
    return NextResponse.json({ error: "Failed to load slide deck" }, { status: 500 });
  }
}
