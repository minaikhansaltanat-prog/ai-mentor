import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAnswerCorrect } from "@/lib/checkAnswer";
import { recordPractice } from "@/lib/gamify";

export async function POST(req: NextRequest, ctx: { params: Promise<{ topicId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { topicId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const answer = typeof body?.answer === "string" ? body.answer : "";
  const lessonOrder = typeof body?.lessonOrder === "number" ? body.lessonOrder : 0;

  const lesson = await db.lesson.findFirst({ where: { topicId, order: lessonOrder } });
  if (!lesson) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const correct = isAnswerCorrect(answer, lesson.practiceAnswer);
  const { xpGain, nextMastery } = await recordPractice({ studentId: session.userId, topicId, correct });

  return NextResponse.json({ correct, xpGain, mastery: nextMastery });
}
