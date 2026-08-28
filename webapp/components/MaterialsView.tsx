"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

type Subject = { code: string; nameKk: string; nameRu: string };
type ClassRoom = { id: string; name: string };
type Material = {
  id: string;
  title: string;
  subjectCode: string | null;
  classRoomName: string | null;
  teacherName: string;
  isMine: boolean;
  hasFile: boolean;
  videoUrl: string | null;
  createdAt: string;
};

export default function MaterialsView({
  lang,
  subjects,
  classes,
  items,
}: {
  lang: Lang;
  subjects: Subject[];
  classes: ClassRoom[];
  items: Material[];
}) {
  const tt = t(lang);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [subjectCode, setSubjectCode] = useState(subjects[0]?.code ?? "");
  const [classRoomId, setClassRoomId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [list, setList] = useState(items);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((m) => m.title.toLowerCase().includes(q));
  }, [list, search]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("subjectCode", subjectCode);
    if (classRoomId) fd.append("classRoomId", classRoomId);
    const file = fileRef.current?.files?.[0];
    if (file) fd.append("file", file);
    if (videoUrl) fd.append("videoUrl", videoUrl);

    const res = await fetch("/api/teacher/materials", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "size" || data.error === "type" ? tt.works.errorType : tt.works.errorType);
      return;
    }
    setTitle("");
    setVideoUrl("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function remove(id: string) {
    setList((l) => l.filter((m) => m.id !== id));
    await fetch(`/api/teacher/materials/${id}`, { method: "DELETE" });
  }

  const subjectName = (code: string | null) => subjects.find((s) => s.code === code)?.[lang === "ru" ? "nameRu" : "nameKk"];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.materials.title}</h1>
      <p className="text-ink-500 mt-1">{tt.materials.subtitle}</p>

      <form onSubmit={upload} className="card p-5 mt-6 space-y-3">
        <input
          className="w-full h-11 rounded-xl border border-ink-200 px-4 focus:border-gold-500 outline-none"
          placeholder={tt.materials.titleLabel}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <select className="h-11 rounded-xl border border-ink-200 px-3" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.code} value={s.code}>
                {lang === "ru" ? s.nameRu : s.nameKk}
              </option>
            ))}
          </select>
          <select className="h-11 rounded-xl border border-ink-200 px-3" value={classRoomId} onChange={(e) => setClassRoomId(e.target.value)}>
            <option value="">{tt.nav.classroom}: —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <label className="block text-xs text-ink-500">{tt.materials.chooseFile}</label>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.pptx,.xlsx,application/pdf" className="text-sm" />
        <label className="block text-xs text-ink-500">{tt.materials.orVideoLink}</label>
        <input
          className="w-full h-11 rounded-xl border border-ink-200 px-4 focus:border-gold-500 outline-none"
          placeholder="https://youtube.com/..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={uploading} className="btn btn-primary h-11 px-6 text-sm disabled:opacity-60">
          {uploading ? tt.common.loading : tt.materials.upload}
        </button>
      </form>

      <input
        className="w-full h-11 rounded-xl border border-ink-200 px-4 mt-6 focus:border-gold-500 outline-none"
        placeholder={tt.materials.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="text-ink-400 mt-6">{tt.materials.empty}</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((m) => (
            <div key={m.id} className="card p-4 flex items-center gap-3">
              <a
                href={m.hasFile ? `/api/files/material/${m.id}` : m.videoUrl ?? "#"}
                target="_blank"
                rel="noopener"
                className="min-w-0 flex-1"
              >
                <p className="font-semibold text-ink-800 truncate">{m.title}</p>
                <p className="text-xs text-ink-400">
                  {[subjectName(m.subjectCode), m.classRoomName, m.teacherName].filter(Boolean).join(" · ")}
                </p>
              </a>
              {m.isMine && (
                <button onClick={() => remove(m.id)} aria-label={tt.common.delete} className="text-ink-300 hover:text-red-500 transition-colors shrink-0">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v13a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10z" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
