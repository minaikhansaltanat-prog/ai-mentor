import { notFound } from "next/navigation";
import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { db } from "@/lib/db";
import LessonView from "@/components/LessonView";

export default async function LessonPage({ params }: { params: Promise<{ topicId: string }> }) {
  await requireRole("STUDENT");
  const lang = await getLang();
  const { topicId } = await params;

  const topic = await db.topic.findUnique({
    where: { id: topicId },
    include: { lessons: { orderBy: { order: "asc" } }, subject: true },
  });
  if (!topic || topic.lessons.length === 0) notFound();

  return <LessonView lang={lang} topic={topic} lessons={topic.lessons} />;
}
