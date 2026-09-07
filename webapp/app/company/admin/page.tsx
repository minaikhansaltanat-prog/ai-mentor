import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";

export default async function CompanyAdminPage() {
  const session = await requireRole("COMPANY_ADMIN");
  const lang = await getLang();
  const tt = t(lang);

  const admin = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!admin.companyId) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-ink-400">—</p>
      </div>
    );
  }

  const company = await db.company.findUniqueOrThrow({
    where: { id: admin.companyId },
    include: {
      employees: {
        where: { role: "PARENT" },
        include: { parentLinks: { where: { status: "APPROVED" }, include: { child: true } } },
      },
    },
  });

  const studentIds = company.employees.flatMap((e) => e.parentLinks.map((l) => l.childId));
  const progress = await db.progress.findMany({ where: { studentId: { in: studentIds } } });
  const avgProgress = progress.length === 0 ? 0 : Math.round(progress.reduce((s, p) => s + p.masteryPct, 0) / progress.length);

  const progressByStudent = new Map<string, number[]>();
  for (const p of progress) {
    const arr = progressByStudent.get(p.studentId) ?? [];
    arr.push(p.masteryPct);
    progressByStudent.set(p.studentId, arr);
  }

  const employeeRows = company.employees.map((e) => {
    const childIds = e.parentLinks.map((l) => l.childId);
    const values = childIds.flatMap((id) => progressByStudent.get(id) ?? []);
    const avg = values.length === 0 ? null : Math.round(values.reduce((s, v) => s + v, 0) / values.length);
    return { id: e.id, name: e.name, phone: e.phone, childCount: childIds.length, avg };
  });

  const usedLicenses = company.employees.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-display font-bold text-2xl text-ink-900">{company.name}</h1>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gold-100 text-gold-700">
          {tt.company.companyCode}: {company.joinCode}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-ink-900">
            {usedLicenses}/{company.licenseCount}
          </p>
          <p className="text-[11px] text-ink-500">{tt.company.licenseUsage}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-ink-900">{usedLicenses}</p>
          <p className="text-[11px] text-ink-500">{tt.company.totalEmployees}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-ink-900">{studentIds.length}</p>
          <p className="text-[11px] text-ink-500">{tt.company.totalChildren}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-2xl text-leaf-600">{avgProgress}%</p>
          <p className="text-[11px] text-ink-500">{tt.company.avgProgress}</p>
        </div>
      </div>

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.company.employees}</p>
      {employeeRows.length === 0 ? (
        <p className="text-ink-400 text-sm">—</p>
      ) : (
        <div className="space-y-2">
          {employeeRows.map((e) => (
            <div key={e.id} className="card p-4 flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-ink-800">{e.name}</span>
              <span className="text-xs text-ink-400">{e.phone}</span>
              <span className="text-xs text-ink-400">
                {e.childCount} {tt.company.childrenShort}
              </span>
              {e.avg !== null && <span className="ml-auto text-xs font-bold text-leaf-600">{e.avg}%</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
