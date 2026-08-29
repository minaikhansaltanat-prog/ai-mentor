"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

type ClassInfo = { name: string; schoolName: string; joinCode: string } | null;

export default function JoinClassCard({ lang, classInfo }: { lang: Lang; classInfo: ClassInfo }) {
  const tt = t(lang);
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/student/join-class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classCode: code }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setCode("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error === "code_invalid" ? tt.auth.error.codeInvalid : tt.auth.error.required);
    }
  }

  if (classInfo) {
    return (
      <div className="card p-5 mt-6">
        <p className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-3">{tt.profile.myClass}</p>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-semibold text-ink-800">{classInfo.name}</p>
            <p className="text-xs text-ink-400 mt-0.5">
              {tt.profile.schoolLabel}: {classInfo.schoolName}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gold-100 text-gold-700">
            {tt.profile.classCodeLabel}: {classInfo.joinCode}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 mt-6">
      <p className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-1">{tt.profile.joinClass}</p>
      <p className="text-sm text-ink-500 mb-4">{tt.profile.joinClassDesc}</p>
      {success ? (
        <p className="text-sm font-semibold text-leaf-600">{tt.profile.joinClassSuccess}</p>
      ) : (
        <form onSubmit={submit} className="flex items-center gap-3 flex-wrap">
          <input
            className="h-11 rounded-xl border border-ink-200 px-4 focus:border-gold-500 outline-none uppercase flex-1 min-w-[140px]"
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={12}
            required
          />
          <button disabled={loading || !code} className="btn btn-primary h-11 px-6 disabled:opacity-60">
            {loading ? tt.common.loading : tt.profile.joinClassBtn}
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
