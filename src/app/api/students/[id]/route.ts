import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const UpdateStudentSchema = z.object({
  name: z.string().min(1, 'Họ tên không được để trống').max(100),
  email: z.string().email('Email không hợp lệ').optional(),
  pin: z.string().regex(/^\d{4,6}$/, 'Mã PIN phải là 4-6 chữ số').optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: studentId } = await params; // ← must await in Next.js 15+

    const body = await req.json();
    const parsed = UpdateStudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, pin } = parsed.data;

    // Verify the student exists
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Học sinh không tồn tại' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { name };

    // Only update email and PIN for managed accounts
    if (student.isManagedAccount) {
      if (email) updateData.email = email;
      // PIN is stored as plain text in the password field for managed accounts
      if (pin) updateData.password = pin;
    }

    const updated = await prisma.user.update({
      where: { id: studentId },
      data: updateData,
      select: { id: true, name: true, email: true, isManagedAccount: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/students/[id]]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: studentId } = await params; // ← must await in Next.js 15+

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        isManagedAccount: true,
        password: true, // PIN for managed accounts
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Không tìm thấy học sinh' }, { status: 404 });
    }

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      isManagedAccount: student.isManagedAccount,
      // Only expose PIN for managed accounts (it's stored as plaintext 4-6 digit code)
      pin: student.isManagedAccount ? student.password : undefined,
    });
  } catch (err) {
    console.error('[GET /api/students/[id]]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}
