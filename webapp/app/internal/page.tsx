import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { usedLicenseCount } from "@/lib/company";
import InternalCompanies from "@/components/InternalCompanies";
import AddInternalAdmin from "@/components/AddInternalAdmin";

export default async function InternalPage() {
  await requireRole("INTERNAL_ADMIN");
  const lang = await getLang();
  const tt = t(lang);

  const companies = await db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { employees: { where: { role: "PARENT" } } } } },
  });

  const rows = await Promise.all(
    companies.map(async (c) => {
      const used = await usedLicenseCount(c.id);
      return {
        id: c.id,
        name: c.name,
        bin: c.bin,
        status: c.status,
        packageType: c.packageType,
        joinCode: c.joinCode,
        licenseCount: c.licenseCount,
        used,
        employees: c._count.employees,
        mrr: c.pricePerLicense > 0 ? used * c.pricePerLicense : null,
      };
    })
  );

  const totalMrr = rows.reduce((sum, r) => sum + (r.mrr ?? 0), 0);
  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.internal.title}</h1>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-ink-900">{rows.length}</p>
          <p className="text-[11px] text-ink-500">{tt.internal.totalCompanies}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-ink-900">{activeCount}</p>
          <p className="text-[11px] text-ink-500">{tt.company.statusActive}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-leaf-600">{totalMrr.toLocaleString(lang === "kk" ? "kk-KZ" : "ru-RU")} ₸</p>
          <p className="text-[11px] text-ink-500">{tt.internal.mrr}</p>
        </div>
      </div>

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.internal.companies}</p>
      <InternalCompanies lang={lang} companies={rows} />

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.internal.addAdmin}</p>
      <AddInternalAdmin lang={lang} />
    </div>
  );
}
