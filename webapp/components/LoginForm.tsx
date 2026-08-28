"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";

export default function LoginForm({ lang }: { lang: Lang }) {
  const tt = t(lang);
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(tt.auth.error.invalid);
      return;
    }
    const data = await res.json();
    router.push(data.redirect);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-gold-200/50 blur-3xl" />
        <div className="absolute bottom-0 -right-24 w-[420px] h-[420px] rounded-full bg-leaf-100/60 blur-3xl" />
      </div>

      <div className="absolute top-5 right-5">
        <LangToggle lang={lang} label={tt.common.langToggle} />
      </div>

      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <span className="w-10 h-10 rounded-2xl bg-gold-500 flex items-center justify-center font-display font-bold text-ink-900">A</span>
        <span className="font-display font-bold text-xl text-ink-900">{tt.appName}</span>
      </Link>

      <form onSubmit={onSubmit} className="card w-full max-w-sm p-7 md:p-8">
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-6">{tt.auth.loginTitle}</h1>

        <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.phone}</label>
        <input
          className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-4 focus:border-gold-500 outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 777 000 0000"
          required
        />

        <label className="block text-sm font-semibold text-ink-700 mb-1.5">{tt.auth.password}</label>
        <input
          type="password"
          className="w-full h-12 rounded-xl border border-ink-200 px-4 mb-2 focus:border-gold-500 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        <button type="submit" disabled={loading} className="btn btn-primary w-full h-12 mt-5 disabled:opacity-60">
          {loading ? tt.common.loading : tt.auth.loginBtn}
        </button>

        <p className="text-sm text-ink-500 mt-5 text-center">
          {tt.auth.noAccount}{" "}
          <Link href="/register" className="text-gold-600 font-semibold hover:underline">
            {tt.auth.goRegister}
          </Link>
        </p>
      </form>
    </main>
  );
}
