"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

export default function LicenseEditor({ lang, licenseCount }: { lang: Lang; licenseCount: number }) {
  const tt = t(lang);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(licenseCount));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/company/license", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseCount: Number(value) }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "below_used") setError(`${tt.company.licenseBelowUsed} (${data.used})`);
      else setError(tt.company.licenseUpdateError);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(String(licenseCount));
          setEditing(true);
        }}
        className="text-[11px] font-semibold text-gold-600 hover:underline mt-1"
      >
        {tt.company.editLicense}
      </button>
    );
  }

  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1.5 justify-center">
        <input
          type="number"
          min={1}
          max={10000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-16 h-8 rounded-lg border border-ink-200 px-2 text-sm text-center focus:border-gold-500 outline-none"
        />
        <button
          onClick={save}
          disabled={busy}
          className="h-8 px-2.5 rounded-lg bg-gold-500 text-ink-900 text-xs font-semibold hover:bg-gold-400 disabled:opacity-60"
        >
          {tt.common.save}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="h-8 px-2.5 rounded-lg border border-ink-200 text-xs font-semibold text-ink-500"
        >
          {tt.common.cancel}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
