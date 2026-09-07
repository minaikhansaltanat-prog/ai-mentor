import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { usedLicenseCount } from "@/lib/company";

export async function POST(req: NextRequest, ctx: { params: Promise<{ linkId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { linkId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const approve = Boolean(body?.approve);

  const link = await db.parentLink.findUnique({ where: { id: linkId }, include: { parent: true, child: true } });
  if (!link || link.childId !== session.userId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let company: { id: string; licenseCount: number } | null = null;
  let usedBefore = 0;

  if (approve && link.parent.companyId) {
    company = await db.company.findUnique({ where: { id: link.parent.companyId } });
    if (company) {
      usedBefore = await usedLicenseCount(company.id, link.parentId);
      if (usedBefore >= company.licenseCount) {
        await notify({
          userId: link.parentId,
          type: "company_license_full",
          titleKk: "Компания лицензиясы жетпеді",
          titleRu: "Не хватило лицензии компании",
          bodyKk: `${link.child.name} байланысын растады, бірақ компанияның лицензия лимиті толған. HR-мен байланысыңыз.`,
          bodyRu: `${link.child.name} подтвердил(а) связь, но лимит лицензий компании исчерпан. Свяжитесь с HR.`,
        });
        return NextResponse.json({ error: "company_license_full" }, { status: 409 });
      }
    }
  }

  if (approve) {
    await db.parentLink.update({ where: { id: linkId }, data: { status: "APPROVED" } });
    await notify({
      userId: link.parentId,
      type: "link_approved",
      titleKk: "Байланыс расталды",
      titleRu: "Связь подтверждена",
      bodyKk: `${link.child.name} сұранысты растады.`,
      bodyRu: `${link.child.name} подтвердил(а) запрос.`,
      linkUrl: "/parent/dashboard",
    });

    if (company) {
      const usedAfter = usedBefore + 1;
      const before = usedBefore / company.licenseCount;
      const after = usedAfter / company.licenseCount;
      if (before < 0.9 && after >= 0.9) {
        const companyAdmin = await db.user.findFirst({ where: { companyId: company.id, role: "COMPANY_ADMIN" } });
        if (companyAdmin) {
          await notify({
            userId: companyAdmin.id,
            type: "company_license_low",
            titleKk: "Лицензия лимитіне жақындап қалды",
            titleRu: "Приближается лимит лицензий",
            bodyKk: `${usedAfter}/${company.licenseCount} лицензия пайдаланылды. Лимитті ұлғайту үшін бізбен байланысыңыз.`,
            bodyRu: `Использовано ${usedAfter}/${company.licenseCount} лицензий. Свяжитесь с нами, чтобы увеличить лимит.`,
            linkUrl: "/company/admin",
          });
        }
      }
    }
  } else {
    await db.parentLink.delete({ where: { id: linkId } });
    await notify({
      userId: link.parentId,
      type: "link_rejected",
      titleKk: "Сұраныс қабылданбады",
      titleRu: "Запрос отклонён",
      bodyKk: `${link.child.name} байланыстыру сұранысын қабылдамады.`,
      bodyRu: `${link.child.name} отклонил(а) запрос на связь.`,
    });
  }

  return NextResponse.json({ ok: true });
}
