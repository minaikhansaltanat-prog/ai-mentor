import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
function isYesterday(a: Date, b: Date) {
  const y = new Date(b);
  y.setDate(y.getDate() - 1);
  return isSameDay(a, y);
}

export async function touchStreak(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const now = new Date();
  let streakDays = user.streakDays;

  if (!user.lastActiveAt) {
    streakDays = 1;
  } else if (isSameDay(user.lastActiveAt, now)) {
    // already counted today
  } else if (isYesterday(user.lastActiveAt, now)) {
    streakDays += 1;
  } else {
    streakDays = 1;
  }

  await db.user.update({ where: { id: userId }, data: { streakDays, lastActiveAt: now } });
  await maybeAwardAchievement(userId, "streak_30", streakDays >= 30);
  return streakDays;
}

export async function recordPractice(opts: { studentId: string; topicId: string; correct: boolean }) {
  const { studentId, topicId, correct } = opts;

  const wasFirstEver = (await db.progress.count({ where: { studentId } })) === 0;

  const delta = correct ? 20 : 6;
  const existing = await db.progress.findUnique({ where: { studentId_topicId: { studentId, topicId } } });
  const nextMastery = Math.min(100, (existing?.masteryPct ?? 0) + delta);

  await db.progress.upsert({
    where: { studentId_topicId: { studentId, topicId } },
    update: { masteryPct: nextMastery, lastActivityAt: new Date() },
    create: { studentId, topicId, masteryPct: nextMastery },
  });

  const xpGain = correct ? 25 : 8;
  await db.user.update({
    where: { id: studentId },
    data: {
      xp: { increment: xpGain },
      solvedCount: correct ? { increment: 1 } : undefined,
    },
  });

  await touchStreak(studentId);

  if (wasFirstEver) await maybeAwardAchievement(studentId, "first_lesson", true);

  const topic = await db.topic.findUnique({ where: { id: topicId }, include: { subject: true } });
  if (topic?.subject.code === "english") {
    await maybeAwardAchievement(studentId, "english_starter", true);
  }
  const MATH_FAMILY = ["math", "algebra", "geometry"];
  if (topic && MATH_FAMILY.includes(topic.subject.code)) {
    const masteredMath = await db.progress.count({
      where: { studentId, masteryPct: { gte: 80 }, topic: { subject: { code: { in: MATH_FAMILY } } } },
    });
    await maybeAwardAchievement(studentId, "math_master", masteredMath >= 3);
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: studentId } });
  await maybeAwardAchievement(studentId, "first_100", user.solvedCount >= 100);

  return { xpGain, nextMastery };
}

export async function maybeAwardAchievement(userId: string, code: string, condition: boolean) {
  if (!condition) return;
  const achievement = await db.achievement.findUnique({ where: { code } });
  if (!achievement) return;
  const already = await db.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  });
  if (already) return;
  await db.userAchievement.create({ data: { userId, achievementId: achievement.id } });
  await db.user.update({ where: { id: userId }, data: { xp: { increment: achievement.xpReward } } });

  await notify({
    userId,
    type: "achievement",
    titleKk: "Жаңа жетістік!",
    titleRu: "Новое достижение!",
    bodyKk: achievement.titleKk,
    bodyRu: achievement.titleRu,
    linkUrl: "/student/profile",
  });

  const parentLinks = await db.parentLink.findMany({ where: { childId: userId, status: "APPROVED" } });
  const child = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  for (const link of parentLinks) {
    await notify({
      userId: link.parentId,
      type: "achievement",
      titleKk: `${child?.name} жаңа жетістікке жетті`,
      titleRu: `${child?.name} получил(а) новое достижение`,
      bodyKk: achievement.titleKk,
      bodyRu: achievement.titleRu,
      linkUrl: "/parent/dashboard",
    });
  }
}

export function xpForLevel(level: number) {
  return level * 1000;
}

export function levelFromXp(xp: number) {
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  const currentLevelFloor = (level - 1) * 1000;
  const nextLevelXp = level * 1000;
  return { level, currentLevelFloor, nextLevelXp, progressInLevel: xp - currentLevelFloor };
}
