import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";
import AddChildForm from "@/components/AddChildForm";

export default async function ParentDashboardPage() {
  const session = await requireRole("PARENT");
  const lang = await getLang();
  const tt = t(lang);

  const allLinks = await db.parentLink.findMany({
    where: { parentId: session.userId },
    include: { child: true },
  });
  const links = allLinks.filter((l) => l.status === "APPROVED");
  const pendingLinks = allLinks.filter((l) => l.status === "PENDING");

  const children = await Promise.all(
    links.map(async (link) => {
      const child = link.child;
      const progress = await db.progress.findMany({
        where: { studentId: child.id },
        include: { topic: true },
        orderBy: { masteryPct: "asc" },
      });
      const overall = progress.length === 0 ? 0 : Math.round(progress.reduce((s, p) => s + p.masteryPct, 0) / progress.length);
      const weak = progress.filter((p) => p.masteryPct < 60).slice(0, 3);
      const strong = progress.filter((p) => p.masteryPct >= 80).slice(0, 3);
      return { child, overall, weak, strong, lessonsCount: progress.length };
    })
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.parent.title}</h1>

      {pendingLinks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {pendingLinks.map((l) => (
            <span key={l.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gold-100 text-gold-700">
              {l.child.name} — {tt.parent.pending}
            </span>
          ))}
        </div>
      )}

      {children.length === 0 && pendingLinks.length === 0 ? (
        <p className="text-ink-400 mt-8">{tt.parent.noChild}</p>
      ) : null}

      {children.length > 0 && (
        <div className="mt-6 space-y-5">
          {children.map(({ child, overall, weak, strong, lessonsCount }) => (
            <div key={child.id} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-gold-200 flex items-center justify-center font-display font-bold text-ink-800">
                  {child.name.charAt(0)}
                </span>
                <div>
                  <p className="font-display font-bold text-ink-900">{child.name}</p>
                  <p className="text-xs text-ink-400">{child.grade ? `${child.grade} сынып / класс` : ""}</p>
                </div>
                <span className="ml-auto font-display font-bold text-2xl text-gold-600">{overall}%</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl bg-sand p-3 text-center">
                  <p className="font-display font-bold text-ink-900">{child.xp}</p>
                  <p className="text-[11px] text-ink-500">XP</p>
                </div>
                <div className="rounded-xl bg-sand p-3 text-center">
                  <p className="font-display font-bold text-ink-900">{lessonsCount}</p>
                  <p className="text-[11px] text-ink-500">{tt.parent.lessonsCount}</p>
                </div>
              </div>

              {weak.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-bold text-ink-400 uppercase mb-1.5">{tt.progress.weakTopics}</p>
                  {weak.map((p) => (
                    <div key={p.id} className="rounded-lg bg-red-50 border border-red-100 px-3 py-1.5 flex justify-between text-xs mb-1.5">
                      <span className="text-ink-700">{lang === "ru" ? p.topic.titleRu : p.topic.titleKk}</span>
                      <span className="font-bold text-red-500">{p.masteryPct}%</span>
                    </div>
                  ))}
                </div>
              )}
              {strong.length > 0 && (
                <div className="mt-2">
                  <p className="text-[11px] font-bold text-ink-400 uppercase mb-1.5">{tt.progress.strongTopics}</p>
                  {strong.map((p) => (
                    <div key={p.id} className="rounded-lg bg-leaf-50 border border-leaf-100 px-3 py-1.5 flex justify-between text-xs mb-1.5">
                      <span className="text-ink-700">{lang === "ru" ? p.topic.titleRu : p.topic.titleKk}</span>
                      <span className="font-bold text-leaf-600">{p.masteryPct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <AddChildForm lang={lang} />
      </div>
    </div>
  );
}
