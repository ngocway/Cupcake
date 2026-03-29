import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: classId } = await params;

    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId: session.user.id },
    });

    if (!cls) {
      return NextResponse.json({ error: 'Lớp học không tồn tại' }, { status: 404 });
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            isManagedAccount: true,
            password: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const students = enrollments.map((e) => ({
      id: e.student.id,
      name: e.student.name ?? '',
      email: e.student.email,
      status: e.status,
      isManagedAccount: e.student.isManagedAccount,
      pin: e.student.isManagedAccount ? e.student.password ?? '' : undefined,
    }));

    return NextResponse.json({
      students,
      class: { id: cls.id, name: cls.name, joinCode: cls.joinCode },
    });
  } catch (err) {
    console.error('[GET /api/classes/[id]/students]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

const AddStudentSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  pin: z.string().regex(/^\d{4,6}$/, 'Mã PIN phải là 4-6 chữ số'),
});

const BulkAddSchema = z.object({
  students: z.array(z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().optional().or(z.literal('')),
  })),
  defaultPin: z.string().optional(),
});

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateManagedEmail(name: string, classCode: string) {
  const slug = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
  return `${slug}.${classCode.toLowerCase()}@managed.local`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: classId } = await params;

    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId: session.user.id },
    });
    if (!cls) {
      return NextResponse.json({ error: 'Lớp học không tồn tại' }, { status: 404 });
    }

    const body = await req.json();

    // Bulk add
    if (body.students) {
      const parsed = BulkAddSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const { students, defaultPin } = parsed.data;

      const created = await Promise.all(students.map(async (s) => {
        const pin = defaultPin && /^\d{4,6}$/.test(defaultPin) ? defaultPin : generatePin();
        const email = s.email && s.email.trim() !== ''
          ? s.email
          : generateManagedEmail(s.name, cls.classCode);

        // Check if a managed student with the same email already exists
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              name: s.name,
              email,
              password: pin, // PIN stored as plain text for managed accounts
              role: 'STUDENT',
              isManagedAccount: true,
            },
          });
        }

        // Enroll if not already
        await prisma.classEnrollment.upsert({
          where: { studentId_classId: { studentId: user.id, classId } },
          create: { studentId: user.id, classId, status: 'ACTIVE' },
          update: {},
        });

        return { id: user.id, name: user.name, email: user.email };
      }));

      return NextResponse.json({ created }, { status: 201 });
    }

    // Single manual add
    const parsed = AddStudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, pin } = parsed.data;

    const resolvedEmail = email && email.trim() !== ''
      ? email
      : generateManagedEmail(name, cls.classCode);

    let user = await prisma.user.findUnique({ where: { email: resolvedEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email: resolvedEmail,
          password: pin, // PIN stored as plain text for managed accounts
          role: 'STUDENT',
          isManagedAccount: true,
        },
      });
    } else {
      // Update name/pin if same managed account
      if (user.isManagedAccount) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name, password: pin },
        });
      }
    }

    await prisma.classEnrollment.upsert({
      where: { studentId_classId: { studentId: user.id, classId } },
      create: { studentId: user.id, classId, status: 'ACTIVE' },
      update: {},
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isManagedAccount: true,
      pin,
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/classes/[id]/students]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
