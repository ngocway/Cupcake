import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Bỏ ghi vào database để tránh truy cập DB không cần thiết và tối ưu hóa hiệu năng
    return NextResponse.json({ success: true, locale: "en" });
  } catch (error) {
    console.error("Error saving locale:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ locale: "en" });
}
