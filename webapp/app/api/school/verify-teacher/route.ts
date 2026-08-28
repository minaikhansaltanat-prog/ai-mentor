import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SCHOOL_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  const body = await req.json().catch(() => null);
  const teacherId = typeof body?.teacherId === "string" ? body.teacherId : "";

  const teacher = await db.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "TEACHER" || teacher.schoolId !== admin.schoolId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await db.user.update({ where: { id: teacherId }, data: { teacherVerified: true } });
  await notify({
    userId: teacherId,
    type: "teacher_verified",
    titleKk: "Сіз верификацияланған мұғалім болдыңыз",
    titleRu: "Вы стали верифицированным учителем",
    bodyKk: "Енді материал жүктей аласыз.",
    bodyRu: "Теперь вы можете загружать материалы.",
    linkUrl: "/teacher/materials",
  });

  return NextResponse.json({ ok: true });
}
