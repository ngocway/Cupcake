import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { locales } from "@/i18n";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locale } = await request.json();

    if (!locale || !locales.includes(locale as any)) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale },
    });

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    console.error("Error saving locale:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ locale: "en" }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { locale: true },
    });

    return NextResponse.json({ locale: user?.locale || "en" });
  } catch (error) {
    return NextResponse.json({ locale: "en" }, { status: 200 });
  }
}
