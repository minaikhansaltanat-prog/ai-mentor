import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { db } from "@/lib/db";
import VoiceView from "@/components/VoiceView";

export default async function VoicePage() {
  const session = await requireRole("STUDENT");
  const lang = await getLang();
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  const grade = user.grade ?? 7;
  const subjects = await db.subject.findMany({
    where: { gradeMin: { lte: grade }, gradeMax: { gte: grade } },
    orderBy: { order: "asc" },
  });
  return <VoiceView lang={lang} subjects={subjects} />;
}
