import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const state = body?.state === "DONE" ? "DONE" : body?.state === "IN_PROGRESS" ? "IN_PROGRESS" : "PENDING";

  await db.homeworkStatus.upsert({
    where: { homeworkId_studentId: { homeworkId: id, studentId: session.userId } },
    update: { state },
    create: { homeworkId: id, studentId: session.userId, state },
  });

  return NextResponse.json({ ok: true });
}
