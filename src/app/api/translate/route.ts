import { NextResponse } from "next/server";
import { translateSelection } from "@/actions/translate-actions";

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();
    if (!text || !targetLanguage) {
      return NextResponse.json({ success: false, error: "Missing text or targetLanguage" }, { status: 400 });
    }
    const result = await translateSelection(text, targetLanguage);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/translate error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to translate selection" }, { status: 500 });
  }
}
