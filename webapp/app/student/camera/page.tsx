import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import CameraView from "@/components/CameraView";

export default async function CameraPage() {
  await requireRole("STUDENT");
  const lang = await getLang();
  return <CameraView lang={lang} />;
}
