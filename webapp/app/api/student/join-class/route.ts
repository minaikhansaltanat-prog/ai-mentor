import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const classCode = typeof body?.classCode === "string" ? body.classCode.trim().toUpperCase() : "";
  if (!classCode) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const student = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (student.classRoomId) return NextResponse.json({ error: "already_in_class" }, { status: 400 });

  const cls = await db.classRoom.findUnique({ where: { joinCode: classCode } });
  if (!cls) return NextResponse.json({ error: "code_invalid" }, { status: 400 });

  await db.user.update({
    where: { id: student.id },
    data: { classRoomId: cls.id, schoolId: cls.schoolId, grade: cls.grade },
  });

  return NextResponse.json({ ok: true });
}
