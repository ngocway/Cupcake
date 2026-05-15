import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TEMPORARY: Disabled next-intl middleware to fix root 404
// TODO: Re-enable with proper [locale] folder structure
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|less|scss|sass|woff|woff2|ttf|eot)).*)",
  ],
};
