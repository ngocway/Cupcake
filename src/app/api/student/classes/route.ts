import { auth } from '@/auth';
import { getCachedStudentClasses } from '@/lib/cached-queries';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await getCachedStudentClasses(session.user.id);
  return NextResponse.json(data);
}
