import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { db } from "@/lib/db";
import HomeworkList from "@/components/HomeworkList";

export default async function HomeworkPage() {
  const session = await requireRole("STUDENT");
  const lang = await getLang();

  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  const homework = user.classRoomId
    ? await db.homework.findMany({
        where: { classRoomId: user.classRoomId },
        include: { statuses: { where: { studentId: user.id } }, topic: true },
        orderBy: { dueDate: "asc" },
      })
    : [];

  const items = homework.map((h) => ({
    id: h.id,
    titleKk: h.titleKk,
    titleRu: h.titleRu,
    dueDate: h.dueDate.toISOString(),
    state: h.statuses[0]?.state ?? "PENDING",
    topicId: h.topicId,
    customQuestionKk: h.customQuestionKk,
    customQuestionRu: h.customQuestionRu,
    hasCustomAnswer: Boolean(h.customAnswer),
  }));

  return <HomeworkList lang={lang} items={items} />;
}
