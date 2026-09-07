"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

type Invite = { id: string; phone: string; name: string | null };
type Employee = { id: string; name: string; phone: string; childCount: number; isActive: boolean; avg: number | null };

export default function CompanyEmployees({
  lang,
  invites,
  employees,
}: {
  lang: Lang;
  invites: Invite[];
  employees: Employee[];
}) {
  const tt = t(lang);
  const [inviteList, setInviteList] = useState(invites);
  const [employeeList, setEmployeeList] = useState(employees);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy("invite");
    setResult(null);
    const res = await fetch("/api/company/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setBusy(null);
    if (res.ok) {
      const data = await res.json();
      setResult({ created: data.created, skipped: data.skipped });
      setText("");
      const entries = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [phone, ...rest] = l.split(",");
          return { phone: phone.trim(), name: rest.join(",").trim() || null };
        });
      setInviteList((list) => [
        ...entries
          .filter((e) => !list.some((x) => x.phone === e.phone) && !employeeList.some((x) => x.phone === e.phone))
          .map((e) => ({ id: `tmp-${e.phone}`, phone: e.phone, name: e.name })),
        ...list,
      ]);
    }
  }

  async function cancelInvite(id: string) {
    setBusy(id);
    await fetch(`/api/company/invite/${id}`, { method: "DELETE" });
    setBusy(null);
    setInviteList((list) => list.filter((i) => i.id !== id));
  }

  async function removeEmployee(id: string) {
    setBusy(id);
    await fetch(`/api/company/employee/${id}`, { method: "DELETE" });
    setBusy(null);
    setEmployeeList((list) => list.filter((e) => e.id !== id));
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const content = await file.text();
    setText((prev) => (prev.trim() ? `${prev.trim()}\n${content.trim()}` : content.trim()));
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold text-ink-400 mb-3 uppercase tracking-wide">{tt.company.inviteTitle}</p>
        <form onSubmit={submitInvite} className="card p-4">
          <textarea
            className="w-full h-24 rounded-xl border border-ink-200 px-3 py-2 text-sm focus:border-gold-500 outline-none resize-none"
            placeholder={tt.company.invitePlaceholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-3">
              <p className="text-xs text-ink-400">{tt.company.inviteHint}</p>
              <label className="text-xs font-semibold text-gold-600 hover:underline cursor-pointer shrink-0">
                {tt.company.uploadCsv}
                <input type="file" accept=".csv,.txt" className="hidden" onChange={onFilePicked} />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy === "invite"}
              className="h-10 px-5 rounded-full bg-gold-500 text-ink-900 text-sm font-semibold hover:bg-gold-400 transition-colors disabled:opacity-60 shrink-0"
            >
              {tt.company.inviteBtn}
            </button>
          </div>
          {result && (
            <p className="text-xs text-leaf-600 mt-2">
              {result.created} {tt.company.inviteCreated}
              {result.skipped > 0 ? `, ${result.skipped} ${tt.company.inviteSkipped}` : ""}
            </p>
          )}
        </form>
      </div>

      {inviteList.length > 0 && (
        <div>
          <p className="text-xs font-bold text-ink-400 mb-3 uppercase tracking-wide">{tt.company.pendingInvites}</p>
          <div className="space-y-2">
            {inviteList.map((inv) => (
              <div key={inv.id} className="card p-4 flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-ink-800">{inv.name || inv.phone}</span>
                {inv.name && <span className="text-xs text-ink-400">{inv.phone}</span>}
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sand text-ink-600">
                  {tt.company.statusPending}
                </span>
                <button
                  onClick={() => cancelInvite(inv.id)}
                  disabled={busy === inv.id || inv.id.startsWith("tmp-")}
                  className="ml-auto h-8 px-3 rounded-full border border-ink-200 text-xs font-semibold text-ink-500 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-60"
                >
                  {tt.company.cancelInvite}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-ink-400 uppercase tracking-wide">{tt.company.employees}</p>
          {employeeList.length > 0 && (
            <a
              href="/api/company/export/employees"
              className="text-xs font-semibold text-gold-600 hover:underline"
            >
              {tt.company.exportCsv}
            </a>
          )}
        </div>
        {employeeList.length === 0 ? (
          <p className="text-ink-400 text-sm">—</p>
        ) : (
          <div className="space-y-2">
            {employeeList.map((e) => (
              <div key={e.id} className="card p-4 flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-ink-800">{e.name}</span>
                <span className="text-xs text-ink-400">{e.phone}</span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    e.isActive ? "bg-leaf-100 text-leaf-700" : "bg-sand text-ink-600"
                  }`}
                >
                  {e.isActive ? tt.company.statusActive : tt.company.statusRegistered}
                </span>
                <span className="text-xs text-ink-400">
                  {e.childCount} {tt.company.childrenShort}
                </span>
                {e.avg !== null && <span className="text-xs font-bold text-leaf-600">{e.avg}%</span>}
                <button
                  onClick={() => removeEmployee(e.id)}
                  disabled={busy === e.id}
                  className="ml-auto h-8 px-3 rounded-full border border-ink-200 text-xs font-semibold text-ink-500 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-60"
                >
                  {tt.company.removeEmployee}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
