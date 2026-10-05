import { auth } from '@/auth';
import { getCachedStudentClasses } from '@/lib/cached-queries';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ activeClasses: [], pendingRequests: [] });
  }

  const studentClasses = await getCachedStudentClasses(userId);
  return NextResponse.json(studentClasses);
}

