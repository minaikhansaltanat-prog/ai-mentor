import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const classRoom = await db.classRoom.findFirst({ where: { teacherId: session.userId }, include: { students: true } });
  if (!classRoom) return NextResponse.json({ error: "no_class" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!title) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const studentIds = classRoom.students.map((s) => s.id);
  const parentLinks = await db.parentLink.findMany({ where: { childId: { in: studentIds }, status: "APPROVED" } });

  const teacher = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  await Promise.all(
    parentLinks.map((link) =>
      notify({
        userId: link.parentId,
        type: "broadcast",
        titleKk: title,
        titleRu: title,
        bodyKk: `${teacher.name} (${classRoom.name}): ${message}`,
        bodyRu: `${teacher.name} (${classRoom.name}): ${message}`,
      })
    )
  );

  return NextResponse.json({ ok: true, count: parentLinks.length });
}
