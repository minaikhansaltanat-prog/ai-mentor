import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { db } from "@/lib/db";
import WorksView from "@/components/WorksView";

export default async function WorksPage() {
  const session = await requireRole("STUDENT");
  const lang = await getLang();

  const works = await db.work.findMany({ where: { studentId: session.userId }, orderBy: { createdAt: "desc" } });

  return (
    <WorksView
      lang={lang}
      items={works.map((w) => ({
        id: w.id,
        title: w.title,
        fileType: w.fileType,
        visibility: w.visibility,
        createdAt: w.createdAt.toISOString(),
      }))}
    />
  );
}
