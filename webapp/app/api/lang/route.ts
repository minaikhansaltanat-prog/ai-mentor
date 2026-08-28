import { NextRequest, NextResponse } from "next/server";
import { setLangCookie } from "@/lib/lang-server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const lang = body?.lang === "ru" ? "ru" : "kk";
  await setLangCookie(lang);
  return NextResponse.json({ ok: true });
}
