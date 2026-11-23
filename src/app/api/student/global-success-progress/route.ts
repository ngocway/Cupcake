import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  GLOBAL_SUCCESS_GRADE_COOKIE,
  getProgressSettingKey,
  getUserGlobalSuccessProgress,
} from "@/lib/global-success-primary-class";

const VALID_STATIONS = new Set(["vocab", "conv", "grammar", "game", "review"]);

export async function GET(req: NextRequest) {
  const session = await auth();
  const cookieGradeRaw = req.cookies.get(GLOBAL_SUCCESS_GRADE_COOKIE)?.value;
  const cookieGrade = cookieGradeRaw ? Number(cookieGradeRaw) : null;
  const validCookieGrade =
    cookieGrade && Number.isInteger(cookieGrade) && cookieGrade >= 1 && cookieGrade <= 5
      ? cookieGrade
      : null;

  if (!session?.user?.id) {
    return NextResponse.json({
      grade: validCookieGrade,
      completedStations: {},
    });
  }

  const dbProgress = await getUserGlobalSuccessProgress(session.user.id);
  return NextResponse.json({
    grade: dbProgress.grade ?? validCookieGrade,
    completedStations: dbProgress.completedStations,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;
    const session = await auth();
    const userId = session?.user?.id || null;

    if (action === "setGrade") {
      const grade = Number(body?.grade);
      if (!Number.isInteger(grade) || grade < 1 || grade > 5) {
        return NextResponse.json({ error: "Invalid grade (must be 1..5)" }, { status: 400 });
      }

      if (userId) {
        const current = await getUserGlobalSuccessProgress(userId);
        const nextValue = {
          grade,
          completedStations: current.completedStations,
        };
        await prisma.systemSetting.upsert({
          where: { key: getProgressSettingKey(userId) },
          update: { value: nextValue as any },
          create: {
            key: getProgressSettingKey(userId),
            value: nextValue as any,
          },
        });
      }

      const res = NextResponse.json({ ok: true, grade });
      res.cookies.set(GLOBAL_SUCCESS_GRADE_COOKIE, String(grade), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return res;
    }

    if (action === "completeStation") {
      const grade = Number(body?.grade);
      const unit = Number(body?.unit);
      const station = String(body?.station || "");
      const score = typeof body?.score === "number" ? body.score : null;

      if (
        !Number.isInteger(grade) ||
        grade < 1 ||
        grade > 5 ||
        !Number.isInteger(unit) ||
        unit < 1 ||
        unit > 20 ||
        !VALID_STATIONS.has(station)
      ) {
        return NextResponse.json({ error: "Invalid station payload" }, { status: 400 });
      }

      const stationKey = `g${grade}-u${unit}-${station}`;
      const record = {
        completedAt: new Date().toISOString(),
        score,
      };

      if (userId) {
        const current = await getUserGlobalSuccessProgress(userId);
        const nextValue = {
          grade: current.grade ?? grade,
          completedStations: {
            ...current.completedStations,
            [stationKey]: record,
          },
        };
        await prisma.systemSetting.upsert({
          where: { key: getProgressSettingKey(userId) },
          update: { value: nextValue as any },
          create: {
            key: getProgressSettingKey(userId),
            value: nextValue as any,
          },
        });
      }

      return NextResponse.json({ ok: true, stationKey, record });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/student/global-success-progress error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
