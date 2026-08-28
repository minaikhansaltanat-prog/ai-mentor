import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";

export default async function ProgressPage() {
  const session = await requireRole("STUDENT");
  const lang = await getLang();
  const tt = t(lang);

  const progress = await db.progress.findMany({
    where: { studentId: session.userId },
    include: { topic: { include: { subject: true } } },
    orderBy: { masteryPct: "asc" },
  });

  const overall = progress.length === 0 ? 0 : Math.round(progress.reduce((s, p) => s + p.masteryPct, 0) / progress.length);

  const bySubject = new Map<string, { name: string; total: number; count: number }>();
  for (const p of progress) {
    const key = p.topic.subject.code;
    const name = lang === "ru" ? p.topic.subject.nameRu : p.topic.subject.nameKk;
    const entry = bySubject.get(key) ?? { name, total: 0, count: 0 };
    entry.total += p.masteryPct;
    entry.count += 1;
    bySubject.set(key, entry);
  }

  const weak = progress.filter((p) => p.masteryPct < 60).slice(0, 5);
  const strong = progress.filter((p) => p.masteryPct >= 80).slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.progress.title}</h1>

      {progress.length === 0 ? (
        <p className="text-ink-400 mt-8">{tt.progress.noData}</p>
      ) : (
        <>
          <div className="card p-6 mt-6 flex items-center gap-5">
            <svg viewBox="0 0 120 120" width="88" height="88">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#F2ECE1" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#E38B1F"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={314}
                strokeDashoffset={314 - (314 * overall) / 100}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div>
              <p className="font-display font-bold text-3xl text-ink-900">{overall}%</p>
              <p className="text-sm text-ink-500">{tt.progress.overall}</p>
            </div>
          </div>

          <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.progress.bySubject}</p>
          <div className="space-y-2.5">
            {[...bySubject.entries()].map(([code, s]) => (
              <div key={code}>
                <div className="flex justify-between text-sm text-ink-700 mb-1">
                  <span>{s.name}</span>
                  <span>{Math.round(s.total / s.count)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-100">
                  <div className="h-1.5 rounded-full bg-gold-500" style={{ width: `${Math.round(s.total / s.count)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {weak.length > 0 && (
            <>
              <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.progress.weakTopics}</p>
              <div className="space-y-2">
                {weak.map((p) => (
                  <div key={p.id} className="rounded-xl bg-red-50 border border-red-100 p-3 flex justify-between text-sm">
                    <span className="text-ink-700">{lang === "ru" ? p.topic.titleRu : p.topic.titleKk}</span>
                    <span className="font-bold text-red-500">{p.masteryPct}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {strong.length > 0 && (
            <>
              <p className="text-xs font-bold text-ink-400 mt-6 mb-3 uppercase tracking-wide">{tt.progress.strongTopics}</p>
              <div className="space-y-2">
                {strong.map((p) => (
                  <div key={p.id} className="rounded-xl bg-leaf-50 border border-leaf-100 p-3 flex justify-between text-sm">
                    <span className="text-ink-700">{lang === "ru" ? p.topic.titleRu : p.topic.titleKk}</span>
                    <span className="font-bold text-leaf-600">{p.masteryPct}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
