import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const work = await db.work.findUnique({ where: { id } });
  if (!work || work.studentId !== session.userId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db.work.delete({ where: { id } });
  await deleteFile(work.fileKey).catch(() => {});

  return NextResponse.json({ ok: true });
}
