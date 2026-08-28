"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

type Work = { id: string; title: string; fileType: string; visibility: string; createdAt: string };

export default function WorksView({ lang, items }: { lang: Lang; items: Work[] }) {
  const tt = t(lang);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("TEACHER");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState(items);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title.trim());
    fd.append("visibility", visibility);
    const res = await fetch("/api/student/works", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "size" ? tt.works.errorSize : tt.works.errorType);
      return;
    }
    setTitle("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
    const data = await res.json();
    setList((l) => [{ id: data.id, title: title.trim(), fileType: file.type, visibility, createdAt: new Date().toISOString() }, ...l]);
  }

  async function remove(id: string) {
    setList((l) => l.filter((w) => w.id !== id));
    await fetch(`/api/student/works/${id}`, { method: "DELETE" });
  }

  const visLabel: Record<string, string> = {
    PRIVATE: tt.works.visibilityPrivate,
    TEACHER: tt.works.visibilityTeacher,
    CLASS: tt.works.visibilityClass,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <Link href="/student/profile" className="text-sm text-ink-500 hover:text-gold-600">
        ← {tt.common.back}
      </Link>
      <h1 className="font-display font-bold text-2xl text-ink-900 mt-2">{tt.works.title}</h1>
      <p className="text-ink-500 mt-1">{tt.works.subtitle}</p>

      <form onSubmit={upload} className="card p-5 mt-6 space-y-3">
        <input
          className="w-full h-11 rounded-xl border border-ink-200 px-4 focus:border-gold-500 outline-none"
          placeholder={tt.works.titleLabel}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="text-sm" required />
        <div className="flex flex-wrap gap-2">
          {(["PRIVATE", "TEACHER", "CLASS"] as const).map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setVisibility(v)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                visibility === v ? "bg-gold-500 border-gold-500 text-ink-900" : "border-ink-200 text-ink-600"
              }`}
            >
              {visLabel[v]}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={uploading} className="btn btn-primary h-11 px-6 text-sm disabled:opacity-60">
          {uploading ? tt.common.loading : tt.works.upload}
        </button>
      </form>

      {list.length === 0 ? (
        <p className="text-ink-400 mt-8">{tt.works.empty}</p>
      ) : (
        <div className="mt-6 space-y-2.5">
          {list.map((w) => (
            <div key={w.id} className="card p-4 flex items-center gap-3">
              <a href={`/api/files/work/${w.id}`} target="_blank" rel="noopener" className="flex-1 min-w-0">
                <p className="font-semibold text-ink-800 truncate">{w.title}</p>
                <p className="text-xs text-ink-400">{visLabel[w.visibility]} · {new Date(w.createdAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "kk-KZ")}</p>
              </a>
              <button onClick={() => remove(w.id)} aria-label={tt.common.delete} className="text-ink-300 hover:text-red-500 transition-colors shrink-0">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v13a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10z" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
