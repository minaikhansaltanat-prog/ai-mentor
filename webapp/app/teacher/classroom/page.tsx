import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { db } from "@/lib/db";
import ClassroomView from "@/components/ClassroomView";

export default async function ClassroomPage() {
  const session = await requireRole("TEACHER");
  const lang = await getLang();

  const teacher = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  const classRoom = await db.classRoom.findFirst({
    where: { teacherId: session.userId },
    include: {
      students: true,
    },
  });

  if (!classRoom) {
    return <ClassroomView lang={lang} verified={teacher.teacherVerified} classRoom={null} students={[]} topicStats={[]} topics={[]} />;
  }

  const studentIds = classRoom.students.map((s) => s.id);
  const progress = await db.progress.findMany({
    where: { studentId: { in: studentIds } },
    include: { topic: true },
  });

  const students = classRoom.students.map((s) => {
    const own = progress.filter((p) => p.studentId === s.id);
    const avg = own.length === 0 ? 0 : Math.round(own.reduce((sum, p) => sum + p.masteryPct, 0) / own.length);
    return { id: s.id, name: s.name, avg };
  });

  const topicMap = new Map<string, { titleKk: string; titleRu: string; total: number; count: number }>();
  for (const p of progress) {
    const entry = topicMap.get(p.topicId) ?? { titleKk: p.topic.titleKk, titleRu: p.topic.titleRu, total: 0, count: 0 };
    entry.total += p.masteryPct;
    entry.count += 1;
    topicMap.set(p.topicId, entry);
  }
  const topicStats = [...topicMap.values()]
    .map((t) => ({ ...t, avg: Math.round(t.total / t.count) }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5);

  const topics = await db.topic.findMany({ where: { gradeMin: { lte: classRoom.grade }, gradeMax: { gte: classRoom.grade } } });

  return (
    <ClassroomView
      lang={lang}
      verified={teacher.teacherVerified}
      classRoom={{ id: classRoom.id, name: classRoom.name, joinCode: classRoom.joinCode }}
      students={students}
      topicStats={topicStats}
      topics={topics.map((t) => ({ id: t.id, titleKk: t.titleKk, titleRu: t.titleRu }))}
    />
  );
}
