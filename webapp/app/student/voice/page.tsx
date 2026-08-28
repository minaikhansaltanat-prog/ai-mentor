import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { db } from "@/lib/db";
import VoiceView from "@/components/VoiceView";

export default async function VoicePage() {
  await requireRole("STUDENT");
  const lang = await getLang();
  const subjects = await db.subject.findMany();
  return <VoiceView lang={lang} subjects={subjects} />;
}
