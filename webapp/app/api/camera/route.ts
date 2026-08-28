import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLang } from "@/lib/lang-server";
import { recognizeProblem } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
  const mediaType = typeof body?.mediaType === "string" ? body.mediaType : "image/jpeg";
  if (!imageBase64) return NextResponse.json({ error: "no_image" }, { status: 400 });

  const lang = await getLang();
  const { recognized, mocked } = await recognizeProblem({ lang, imageBase64, mediaType });

  return NextResponse.json({ recognized, mocked });
}
