import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ materialId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { materialId } = await ctx.params;
  const material = await db.material.findUnique({ where: { id: materialId } });
  if (!material || !material.fileKey) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let allowed = material.teacherId === session.userId;

  if (!allowed && material.visibility === "SCHOOL") {
    const viewer = await db.user.findUnique({ where: { id: session.userId } });
    if (viewer?.schoolId && viewer.schoolId === material.schoolId) {
      if (!material.classRoomId) allowed = true;
      else if (viewer.classRoomId === material.classRoomId) allowed = true;
      else {
        const teachesClass = await db.classRoom.findFirst({ where: { id: material.classRoomId, teacherId: viewer.id } });
        if (teachesClass) allowed = true;
      }
    }
  }

  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const file = await readFile(material.fileKey);
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new NextResponse(Buffer.from(file.body), {
    headers: { "Content-Type": file.contentType, "Cache-Control": "private, max-age=3600" },
  });
}
