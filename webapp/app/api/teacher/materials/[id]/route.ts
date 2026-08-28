import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const material = await db.material.findUnique({ where: { id } });
  if (!material || material.teacherId !== session.userId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db.material.delete({ where: { id } });
  if (material.fileKey) await deleteFile(material.fileKey).catch(() => {});

  return NextResponse.json({ ok: true });
}
