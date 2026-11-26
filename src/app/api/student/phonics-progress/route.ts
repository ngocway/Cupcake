import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import {
  getPhonicsProgressSettingKey,
  getUserPhonicsProgress,
} from '@/lib/phonics-progress';

const VALID_STATIONS = new Set(['blending', 'flashcards', 'game', 'story']);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ completedStations: {} });
  }

  const dbProgress = await getUserPhonicsProgress(session.user.id);
  return NextResponse.json(dbProgress);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;
    const session = await auth();
    const userId = session?.user?.id || null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'completeStation') {
      const day = Number(body?.day);
      const station = String(body?.station || '').toLowerCase();
      const score = body?.score !== undefined ? Number(body.score) : null;

      if (!Number.isInteger(day) || day < 1 || day > 45 || !VALID_STATIONS.has(station)) {
        return NextResponse.json(
          { error: 'Invalid day (1..45) or station' },
          { status: 400 }
        );
      }

      const stationKey = `d${day}-${station}`;
      const current = await getUserPhonicsProgress(userId);
      const nextCompleted = {
        ...current.completedStations,
        [stationKey]: {
          completedAt: new Date().toISOString(),
          score: Number.isFinite(score) ? score : null,
        },
      };

      const nextValue = { completedStations: nextCompleted };

      await prisma.systemSetting.upsert({
        where: { key: getPhonicsProgressSettingKey(userId) },
        update: { value: nextValue as any },
        create: {
          key: getPhonicsProgressSettingKey(userId),
          value: nextValue as any,
        },
      });

      return NextResponse.json({ ok: true, stationKey });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Phonics progress update error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
