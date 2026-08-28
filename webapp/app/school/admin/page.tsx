import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";
import PendingTeachers from "@/components/PendingTeachers";

export default async function SchoolAdminPage() {
  const session = await requireRole("SCHOOL_ADMIN");
  const lang = await getLang();
  const tt = t(lang);

  const admin = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!admin.schoolId) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-ink-400">—</p>
      </div>
    );
  }

  const school = await db.school.findUniqueOrThrow({
    where: { id: admin.schoolId },
    include: { classes: { include: { students: true, teacher: true } } },
  });

  const studentIds = school.classes.flatMap((c) => c.students.map((s) => s.id));
  const teacherCount = new Set(school.classes.map((c) => c.teacherId).filter(Boolean)).size;

  const progress = await db.progress.findMany({ where: { studentId: { in: studentIds } } });
  const avgProgress = progress.length === 0 ? 0 : Math.round(progress.reduce((s, p) => s + p.masteryPct, 0) / progress.length);

  const perStudentAvg = new Map<string, { total: number; count: number; name: string }>();
  for (const c of school.classes) {
    for (const s of c.students) perStudentAvg.set(s.id, { total: 0, count: 0, name: s.name });
  }
  for (const p of progress) {
    const entry = perStudentAvg.get(p.studentId);
    if (entry) {
      entry.total += p.masteryPct;
      entry.count += 1;
    }
  }
  const riskStudents = [...perStudentAvg.values()]
    .map((e) => ({ name: e.name, avg: e.count ? Math.round(e.total / e.count) : 0 }))
    .filter((e) => e.avg < 50)
    .sort((a, b) => a.avg - b.avg);

  const pendingTeachers = await db.user.findMany({
    where: { role: "TEACHER", schoolId: admin.schoolId, teacherVerified: false },
    select: { id: true, name: true, phone: true, teacherSubject: true },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-display font-bold text-2xl text-ink-900">{school.name}</h1>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gold-100 text-gold-700">
          {tt.school.schoolCode}: {school.joinCode}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-ink-900">{studentIds.length}</p>
          <p className="text-[11px] text-ink-500">{tt.school.totalStudents}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-ink-900">{teacherCount}</p>
          <p className="text-[11px] text-ink-500">{tt.school.totalTeachers}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-ink-900">{school.classes.length}</p>
          <p className="text-[11px] text-ink-500">{tt.school.totalClasses}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-leaf-600">{avgProgress}%</p>
          <p className="text-[11px] text-ink-500">{tt.school.avgProgress}</p>
        </div>
      </div>

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.school.pendingTeachers}</p>
      <PendingTeachers lang={lang} items={pendingTeachers} />

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.school.riskZone}</p>
      {riskStudents.length === 0 ? (
        <p className="text-ink-400 text-sm">—</p>
      ) : (
        <div className="space-y-2">
          {riskStudents.map((s, i) => (
            <div key={i} className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 flex justify-between text-sm">
              <span className="text-ink-700">{s.name}</span>
              <span className="font-bold text-red-500">{s.avg}%</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.nav.classroom}</p>
      <div className="space-y-2">
        {school.classes.map((c) => (
          <div key={c.id} className="card p-4 flex items-center gap-3">
            <span className="font-semibold text-ink-800">{c.name}</span>
            <span className="text-xs text-ink-400">{c.teacher ? c.teacher.name : "—"}</span>
            <span className="ml-auto text-xs text-ink-400">{c.students.length} оқушы</span>
          </div>
        ))}
      </div>
    </div>
  );
}
