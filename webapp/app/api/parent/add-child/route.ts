import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requestChildLink } from "@/lib/parentLink";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "PARENT") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const childPhone = typeof body?.childPhone === "string" ? body.childPhone : "";
  if (!childPhone) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const result = await requestChildLink(session.userId, session.name, childPhone);
  if (result === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (result === "already_linked") return NextResponse.json({ error: "already_linked" }, { status: 409 });

  return NextResponse.json({ ok: true });
}
