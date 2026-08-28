import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

export type RequestChildLinkResult = "ok" | "not_found" | "already_linked";

export async function requestChildLink(parentId: string, parentName: string, childPhone: string): Promise<RequestChildLinkResult> {
  const child = await db.user.findUnique({ where: { phone: childPhone } });
  if (!child || child.role !== "STUDENT") return "not_found";

  const existing = await db.parentLink.findUnique({ where: { parentId_childId: { parentId, childId: child.id } } });
  if (existing) return "already_linked";

  const link = await db.parentLink.create({ data: { parentId, childId: child.id, status: "PENDING" } });
  await notify({
    userId: child.id,
    type: "link_request",
    titleKk: "Ата-ана байланыстырғысы келеді",
    titleRu: "Родитель хочет привязать аккаунт",
    bodyKk: `${parentName} сізбен байланысуды сұрайды.`,
    bodyRu: `${parentName} запрашивает связь с вашим аккаунтом.`,
    refId: link.id,
  });
  return "ok";
}
