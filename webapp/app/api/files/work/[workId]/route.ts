import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ workId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { workId } = await ctx.params;
  const work = await db.work.findUnique({ where: { id: workId }, include: { student: true } });
  if (!work) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let allowed = work.studentId === session.userId;

  if (!allowed && work.visibility !== "PRIVATE" && work.student.classRoomId) {
    if (work.visibility === "TEACHER" || work.visibility === "CLASS") {
      const isTeacher = await db.classRoom.findFirst({ where: { id: work.student.classRoomId, teacherId: session.userId } });
      if (isTeacher) allowed = true;
    }
    if (!allowed && work.visibility === "CLASS") {
      const classmate = await db.user.findFirst({ where: { id: session.userId, classRoomId: work.student.classRoomId } });
      if (classmate) allowed = true;
    }
  }

  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const file = await readFile(work.fileKey);
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new NextResponse(Buffer.from(file.body), {
    headers: { "Content-Type": file.contentType, "Cache-Control": "private, max-age=3600" },
  });
}
