import { Suspense } from "react";
import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { db } from "@/lib/db";
import ChatView from "@/components/ChatView";

export default async function AiTeacherPage() {
  await requireRole("STUDENT");
  const lang = await getLang();
  const subjects = await db.subject.findMany();

  return (
    <Suspense>
      <ChatView lang={lang} subjects={subjects} />
    </Suspense>
  );
}
