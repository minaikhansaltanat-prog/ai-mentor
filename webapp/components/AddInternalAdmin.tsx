"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export default function AddInternalAdmin({ lang }: { lang: Lang }) {
  const tt = t(lang);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/internal/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password }),
    });
    setBusy(false);
    if (res.ok) {
      setMessage({ ok: true, text: tt.internal.adminAdded });
      setName("");
      setPhone("");
      setPassword("");
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ ok: false, text: data.error === "phone_taken" ? tt.auth.error.phoneTaken : tt.internal.adminAddError });
    }
  }

  return (
    <form onSubmit={submit} className="card p-4 flex items-center gap-2 flex-wrap">
      <input
        className="h-10 rounded-lg border border-ink-200 px-3 text-sm w-40 focus:border-gold-500 outline-none"
        placeholder={tt.auth.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="h-10 rounded-lg border border-ink-200 px-3 text-sm w-40 focus:border-gold-500 outline-none"
        placeholder={tt.auth.phone}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <input
        className="h-10 rounded-lg border border-ink-200 px-3 text-sm w-32 focus:border-gold-500 outline-none"
        placeholder={tt.auth.password}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="h-10 px-4 rounded-lg bg-gold-500 text-ink-900 text-sm font-semibold hover:bg-gold-400 disabled:opacity-60"
      >
        {tt.internal.addAdmin}
      </button>
      {message && (
        <p className={`text-xs w-full ${message.ok ? "text-leaf-600" : "text-red-500"}`}>{message.text}</p>
      )}
    </form>
  );
}
