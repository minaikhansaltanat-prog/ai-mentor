"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

type Row = {
  id: string;
  name: string;
  bin: string | null;
  status: string;
  packageType: string;
  joinCode: string;
  licenseCount: number;
  used: number;
  employees: number;
  mrr: number | null;
};

const STATUSES = ["TRIAL", "ACTIVE", "SUSPENDED", "CHURNED"] as const;
const STATUS_KEY = {
  TRIAL: "statusTrial",
  ACTIVE: "statusActive",
  SUSPENDED: "statusSuspended",
  CHURNED: "statusChurned",
} as const;

export default function InternalCompanies({ lang, companies }: { lang: Lang; companies: Row[] }) {
  const tt = t(lang);
  const [rows, setRows] = useState(companies);
  const [busy, setBusy] = useState<string | null>(null);

  async function changeStatus(id: string, status: string) {
    setBusy(id);
    const res = await fetch(`/api/internal/company/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) {
      setRows((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  }

  if (rows.length === 0) return <p className="text-ink-400 text-sm">—</p>;

  return (
    <div className="space-y-2.5">
      {rows.map((c) => (
        <div key={c.id} className="card p-4 flex items-center gap-3 flex-wrap">
          <div className="min-w-[140px]">
            <p className="font-semibold text-ink-800">{c.name}</p>
            <p className="text-xs text-ink-400">{c.bin || c.joinCode}</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-ink-100 text-ink-700">
            {tt.company.packages[c.packageType as keyof typeof tt.company.packages] ?? c.packageType}
          </span>
          <span className="text-xs text-ink-500">
            {c.used}/{c.licenseCount} {tt.internal.licenses}
          </span>
          <span className="text-xs text-ink-500">
            {c.employees} {tt.company.employees}
          </span>
          <span className="text-xs font-bold text-leaf-600">
            {c.mrr !== null ? `${c.mrr.toLocaleString(lang === "kk" ? "kk-KZ" : "ru-RU")} ₸` : tt.company.byContract}
          </span>
          <select
            value={c.status}
            disabled={busy === c.id}
            onChange={(e) => changeStatus(c.id, e.target.value)}
            className="ml-auto h-9 rounded-lg border border-ink-200 px-2 text-xs font-semibold text-ink-700 focus:border-gold-500 outline-none disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {tt.company[STATUS_KEY[s]]}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
