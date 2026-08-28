"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Lang } from "@/lib/i18n";

export default function LangToggle({ lang, label }: { lang: Lang; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: Lang = lang === "ru" ? "kk" : "ru";
    startTransition(async () => {
      await fetch("/api/lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: next }),
      });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="h-10 px-3.5 rounded-full border border-ink-200 bg-white/70 hover:border-gold-500 hover:bg-white transition-colors flex items-center gap-1.5 text-sm font-bold text-ink-800 disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-gold-600" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.2 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.2-3.7-8.5S9.6 5.8 12 3.5z" />
      </svg>
      {label}
    </button>
  );
}
