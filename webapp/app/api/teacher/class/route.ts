import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateJoinCode } from "@/lib/codes";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!user.schoolId) return NextResponse.json({ error: "no_school" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const grade = Number(body?.grade) || 7;
  if (!name) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const joinCode = generateJoinCode();
  const classRoom = await db.classRoom.create({
    data: { name, grade, schoolId: user.schoolId, teacherId: user.id, joinCode },
  });

  return NextResponse.json({ ok: true, classRoom });
}
