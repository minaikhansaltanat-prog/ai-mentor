import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const classRoom = await db.classRoom.findFirst({ where: { teacherId: session.userId } });
  if (!classRoom) return NextResponse.json({ error: "no_class" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const titleKk = typeof body?.titleKk === "string" ? body.titleKk : "";
  const titleRu = typeof body?.titleRu === "string" ? body.titleRu : titleKk;
  const topicId = typeof body?.topicId === "string" && body.topicId ? body.topicId : null;
  const dueDate = body?.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (!titleKk) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const homework = await db.homework.create({
    data: { classRoomId: classRoom.id, titleKk, titleRu, topicId, dueDate },
  });

  return NextResponse.json({ ok: true, homework });
}
