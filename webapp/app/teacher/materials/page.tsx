import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";
import MaterialsView from "@/components/MaterialsView";

export default async function MaterialsPage() {
  const session = await requireRole("TEACHER");
  const lang = await getLang();
  const tt = t(lang);

  const teacher = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  if (!teacher.teacherVerified) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 text-center">
        <h1 className="font-display font-bold text-2xl text-ink-900">{tt.materials.title}</h1>
        <div className="card p-6 mt-6">
          <p className="font-semibold text-ink-800">{tt.materials.notVerifiedTitle}</p>
          <p className="text-sm text-ink-500 mt-2">{tt.materials.notVerifiedText}</p>
        </div>
      </div>
    );
  }

  const [subjects, classes, materials] = await Promise.all([
    db.subject.findMany({ orderBy: { order: "asc" } }),
    db.classRoom.findMany({ where: { teacherId: session.userId } }),
    db.material.findMany({
      where: { schoolId: teacher.schoolId ?? undefined },
      orderBy: { createdAt: "desc" },
      include: { teacher: { select: { name: true } }, classRoom: { select: { name: true } } },
    }),
  ]);

  return (
    <MaterialsView
      lang={lang}
      subjects={subjects.map((s) => ({ code: s.code, nameKk: s.nameKk, nameRu: s.nameRu }))}
      classes={classes.map((c) => ({ id: c.id, name: c.name }))}
      items={materials.map((m) => ({
        id: m.id,
        title: m.title,
        subjectCode: m.subjectCode,
        classRoomName: m.classRoom?.name ?? null,
        teacherName: m.teacher.name,
        isMine: m.teacherId === session.userId,
        kind: m.kind as "FILE" | "PHOTO" | "VIDEO" | "TEXT",
        videoUrl: m.videoUrl,
        textContent: m.textContent,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
