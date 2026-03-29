import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const CreateClassSchema = z.object({
  name: z.string().min(1, 'Tên lớp không được để trống').max(100),
  description: z.string().optional(),
});

function generateCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classes = await prisma.class.findMany({
      where: { teacherId: session.user.id, deletedAt: null },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(classes);
  } catch (err) {
    console.error('[GET /api/classes]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, description } = parsed.data;

    // Generate unique codes
    let classCode: string;
    let joinCode: string;
    let attempts = 0;

    do {
      classCode = generateCode(6);
      joinCode = generateCode(6);
      const existing = await prisma.class.findFirst({
        where: { OR: [{ classCode }, { joinCode }] },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        classCode,
        joinCode,
        teacherId: session.user.id,
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (err) {
    console.error('[POST /api/classes]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
