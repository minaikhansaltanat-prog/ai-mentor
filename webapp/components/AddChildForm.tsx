"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

export default function AddChildForm({ lang }: { lang: Lang }) {
  const tt = t(lang);
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/parent/add-child", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childPhone: phone }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "ok", text: tt.parent.addChildSent });
      setPhone("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "error", text: data.error === "not_found" ? tt.parent.addChildNotFound : tt.parent.addChildAlready });
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5">
      <h2 className="font-display font-bold text-lg text-ink-900 mb-1">{tt.parent.addChild}</h2>
      <p className="text-sm text-ink-500 mb-3">{tt.parent.addChildDesc}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="flex-1 h-11 rounded-xl border border-ink-200 px-4 focus:border-gold-500 outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 777 000 0000"
          required
        />
        <button type="submit" disabled={loading || !phone} className="btn btn-primary h-11 px-6 text-sm disabled:opacity-60">
          {loading ? tt.common.loading : tt.parent.addChild}
        </button>
      </div>
      {message && <p className={`text-sm mt-2 ${message.type === "ok" ? "text-leaf-600" : "text-red-500"}`}>{message.text}</p>}
    </form>
  );
}
