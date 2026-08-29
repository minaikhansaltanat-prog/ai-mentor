import Link from "next/link";
import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";

export default async function StudentHomePage() {
  const session = await requireRole("STUDENT");
  const lang = await getLang();
  const tt = t(lang);

  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  const grade = user.grade ?? 7;

  const subjects = await db.subject.findMany({
    where: { gradeMin: { lte: grade }, gradeMax: { gte: grade } },
    orderBy: { order: "asc" },
    include: {
      topics: {
        where: { gradeMin: { lte: grade }, gradeMax: { gte: grade } },
        include: { progress: { where: { studentId: user.id } } },
        orderBy: { order: "asc" },
      },
    },
  });

  const subjectStats = subjects.map((s) => {
    const topics = s.topics;
    const avg =
      topics.length === 0
        ? 0
        : Math.round(topics.reduce((sum, tp) => sum + (tp.progress[0]?.masteryPct ?? 0), 0) / topics.length);
    return { subject: s, avg, topics };
  });

  let goalTopic: (typeof subjects)[number]["topics"][number] | null = null;
  let goalSubjectName = "";
  outer: for (const st of subjectStats) {
    for (const tp of st.topics) {
      const mastery = tp.progress[0]?.masteryPct ?? 0;
      if (mastery < 100) {
        goalTopic = tp;
        goalSubjectName = lang === "ru" ? st.subject.nameRu : st.subject.nameKk;
        break outer;
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <p className="text-ink-500">{tt.student.hi},</p>
      <h1 className="font-display font-bold text-2xl md:text-3xl text-ink-900">{user.name}</h1>

      {goalTopic ? (
        <div className="mt-6 rounded-3xl bg-gold-500 p-6 text-ink-900">
          <p className="text-xs font-bold opacity-80 uppercase tracking-wide">{tt.student.todayGoal}</p>
          <p className="font-display font-bold text-2xl mt-1">{lang === "ru" ? goalTopic.titleRu : goalTopic.titleKk}</p>
          <p className="text-sm opacity-80 mt-0.5">{goalSubjectName}</p>
          <Link href={`/student/lesson/${goalTopic.id}`} className="btn btn-primary bg-ink-900 text-gold-300 hover:bg-ink-800 h-11 px-6 mt-4 inline-flex">
            {tt.student.startLesson}
          </Link>
        </div>
      ) : (
        <div className="mt-6 card p-6 text-ink-500">{tt.student.noGoalYet}</div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs text-ink-400">{tt.student.streak}</p>
          <p className="font-display font-bold text-2xl text-ink-900">
            {user.streakDays} {tt.student.days}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-400">XP</p>
          <p className="font-display font-bold text-2xl text-leaf-600">{user.xp}</p>
        </div>
      </div>

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.student.quickActions}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/student/camera" className="card p-5 flex items-center gap-4 hover:shadow-lift transition-shadow">
          <span className="w-11 h-11 rounded-2xl bg-leaf-100 flex items-center justify-center text-leaf-600 shrink-0">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8.5A1.5 1.5 0 015.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0120 8.5v9A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5v-9z" /><circle cx="12" cy="13" r="3.4" /></svg>
          </span>
          <span className="font-semibold text-ink-800">{tt.student.openCamera}</span>
        </Link>
        <Link href="/student/voice" className="card p-5 flex items-center gap-4 hover:shadow-lift transition-shadow">
          <span className="w-11 h-11 rounded-2xl bg-gold-100 flex items-center justify-center text-gold-600 shrink-0">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3m-3.5 0h7" /></svg>
          </span>
          <span className="font-semibold text-ink-800">{tt.student.openVoice}</span>
        </Link>
      </div>

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.student.mySubjects}</p>
      <div className="space-y-3">
        {subjectStats.map(({ subject, avg }) => (
          <div key={subject.id} className="card p-4 flex items-center gap-4">
            <span className="flex-1 font-semibold text-ink-800">{lang === "ru" ? subject.nameRu : subject.nameKk}</span>
            <div className="w-32 h-1.5 rounded-full bg-ink-100 hidden sm:block">
              <div className="h-1.5 rounded-full bg-gold-500" style={{ width: `${avg}%` }} />
            </div>
            <span className="text-sm font-bold text-ink-600 w-10 text-right">{avg}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
