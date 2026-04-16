
import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized or missing email' }, { status: 401 });
  }

  // This is a debug tool to bypass UI for agent verification
  // In a real app, this would be highly protected or removed
  try {
     // Note: We use the credentials provider logic here but simplified
     // For this to work with NextAuth manually, we usually use the signIn function
     // But since we want to SET THE COOKIE, we should redirect to the actual login with params if supported
     // Or just use the fact that we can trigger a login.
     
     // For now, let's just use the Browser Agent to visit the REAL login page 
     // but with a MUCH HIGHER patience level.
     return NextResponse.json({ message: "Debug route active. Please navigate to /teacher/login" });
  } catch (err) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
