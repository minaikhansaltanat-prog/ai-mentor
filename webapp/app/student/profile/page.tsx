import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { levelFromXp } from "@/lib/gamify";
import Link from "next/link";
import JoinClassCard from "@/components/JoinClassCard";

const ACHIEVEMENT_PATHS: Record<string, string> = {
  trophy: "M7 4h10v5a5 5 0 01-10 0V4zM7 5H4v2a3 3 0 003 3M17 5h3v2a3 3 0 01-3 3M10 18h4M12 14v4m-3 3h6",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 17l-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5z",
  trend: "M4 16l5-5 4 4 7-8M20 7h-4v4",
  chat: "M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v9a1.5 1.5 0 01-1.5 1.5H9l-4 4v-4H5.5A1.5 1.5 0 014 14.5v-9z",
  check: "M5 13l4.5 4.5L19 8",
};

function AchievementIcon({ icon }: { icon: string }) {
  const d = ACHIEVEMENT_PATHS[icon] ?? ACHIEVEMENT_PATHS.trophy;
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default async function ProfilePage() {
  const session = await requireRole("STUDENT");
  const lang = await getLang();
  const tt = t(lang);

  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  const achievements = await db.userAchievement.findMany({
    where: { userId: user.id },
    include: { achievement: true },
    orderBy: { earnedAt: "desc" },
  });

  const classRoom = user.classRoomId
    ? await db.classRoom.findUnique({ where: { id: user.classRoomId }, include: { school: true } })
    : null;

  const { level, progressInLevel, nextLevelXp, currentLevelFloor } = levelFromXp(user.xp);
  const pct = Math.round((progressInLevel / (nextLevelXp - currentLevelFloor)) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.profile.title}</h1>

      <div className="rounded-3xl bg-gradient-to-br from-gold-500 to-gold-300 p-6 text-ink-900 mt-6">
        <p className="text-xs font-bold opacity-80">
          {tt.profile.level.toUpperCase()} {level}
        </p>
        <p className="font-display font-bold text-2xl">{user.name}</p>
        <div className="mt-3 h-2.5 rounded-full bg-ink-900/15">
          <div className="h-2.5 rounded-full bg-ink-900" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs mt-1.5 opacity-80">
          {user.xp} / {nextLevelXp} XP
        </p>
      </div>

      <JoinClassCard
        lang={lang}
        classInfo={
          classRoom
            ? { name: classRoom.name, schoolName: classRoom.school.name, joinCode: classRoom.joinCode }
            : null
        }
      />

      <Link href="/student/works" className="card p-4 mt-5 flex items-center gap-3 hover:shadow-lift transition-shadow">
        <span className="w-10 h-10 rounded-xl bg-leaf-100 flex items-center justify-center text-leaf-600 shrink-0">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18M8 4v5" /></svg>
        </span>
        <span className="font-semibold text-ink-800 flex-1">{tt.works.title}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink-300"><path d="M9 6l6 6-6 6" /></svg>
      </Link>

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.profile.achievements}</p>

      {achievements.length === 0 ? (
        <p className="text-ink-400">{tt.profile.noAchievements}</p>
      ) : (
        <div className="space-y-2.5">
          {achievements.map((ua) => (
            <div key={ua.id} className="card p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center text-gold-600 shrink-0">
                <AchievementIcon icon={ua.achievement.icon} />
              </span>
              <div>
                <p className="font-semibold text-ink-800">{lang === "ru" ? ua.achievement.titleRu : ua.achievement.titleKk}</p>
                <p className="text-xs text-ink-400">{lang === "ru" ? ua.achievement.descRu : ua.achievement.descKk}</p>
              </div>
              <span className="ml-auto text-xs font-bold text-gold-600">+{ua.achievement.xpReward} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
