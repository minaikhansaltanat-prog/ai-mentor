import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAnswerCorrect } from "@/lib/checkAnswer";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const answer = typeof body?.answer === "string" ? body.answer : "";

  const homework = await db.homework.findUnique({ where: { id } });
  if (!homework || !homework.customAnswer) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const correct = isAnswerCorrect(answer, homework.customAnswer);
  const state = correct ? "DONE" : "IN_PROGRESS";

  await db.homeworkStatus.upsert({
    where: { homeworkId_studentId: { homeworkId: id, studentId: session.userId } },
    update: { state },
    create: { homeworkId: id, studentId: session.userId, state },
  });

  if (correct) {
    await db.user.update({ where: { id: session.userId }, data: { xp: { increment: 15 } } });
  }

  return NextResponse.json({ ok: true, correct });
}
