"use server"

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function generateRandomPIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Thêm hoặc tạo mới học sinh dưới dạng Managed Accounts.
 */
export async function createManagedAccounts(classId: string, studentNames: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  // Xác minh quyền sở hữu lớp
  const classObj = await prisma.class.findUnique({ where: { id: classId }});
  if (!classObj || classObj.teacherId !== session.user.id) throw new Error('Forbidden: Not owner of this class');

  const results = [];
  
  for (const name of studentNames) {
    const rawPin = generateRandomPIN();
    const hash = await bcrypt.hash(rawPin, 10);
    // Tạo email ảo nội bộ cho Managed Account
    const pseudoEmail = `pseudo_${Date.now()}_${Math.floor(Math.random()*1000)}@managed.engmaster.local`;

    const user = await prisma.user.create({
      data: {
        name,
        email: pseudoEmail,
        password: hash,
        isManagedAccount: true,
        role: 'STUDENT',
      }
    });

    await prisma.classEnrollment.create({
      data: {
        classId,
        studentId: user.id,
        status: 'ACTIVE' // Tài khoản tạo sẵn (managed) thì mặc định là ACTIVE luôn
      }
    });

    // Trả về PIN gốc DÙY NHẤT LẦN NÀY để giáo viên copy gửi học sinh
    results.push({ id: user.id, name, rawPin });
  }

  return { success: true, newAccounts: results };
}

/**
 * Khôi phục / Tạo mới một PIN (Mật khẩu) khác cho một Managed Account.
 */
export async function resetManagedAccountPIN(studentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  const user = await prisma.user.findUnique({ where: { id: studentId }});
  if (!user || user.isManagedAccount !== true) {
    throw new Error('Action not allowed on standard accounts');
  }

  // Generate new PIN and hash
  const newPin = generateRandomPIN();
  const hash = await bcrypt.hash(newPin, 10);

  await prisma.user.update({
    where: { id: studentId },
    data: { password: hash }
  });

  return { success: true, newPin };
}

/**
 * Luồng Email Invitation cho Normal Accounts (Mock)
 */
export async function inviteStudentsViaEmail(classId: string, emails: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Logic: Insert vào ClassEnrollment với status = 'INVITED'
  // Kích hoạt service gửi thư chứa Token...
  
  console.log(`[Email Service Mock] Sending invites for class ${classId} to: ${emails.join(', ')}`);
  
  return { success: true, message: `Invited ${emails.length} students` };
}
