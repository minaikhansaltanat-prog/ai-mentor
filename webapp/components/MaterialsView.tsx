"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

type Subject = { code: string; nameKk: string; nameRu: string };
type ClassRoom = { id: string; name: string };
type Kind = "FILE" | "PHOTO" | "VIDEO" | "TEXT";
type Material = {
  id: string;
  title: string;
  subjectCode: string | null;
  classRoomName: string | null;
  teacherName: string;
  isMine: boolean;
  kind: Kind;
  videoUrl: string | null;
  textContent: string | null;
  createdAt: string;
};

const KIND_ICON: Record<Kind, React.ReactNode> = {
  FILE: (
    <path d="M6 3h9l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5" />
  ),
  PHOTO: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15l-5-5-8 8" />
    </>
  ),
  VIDEO: <path d="M4 5.5A1.5 1.5 0 015.5 4h9A1.5 1.5 0 0116 5.5v13A1.5 1.5 0 0114.5 20h-9A1.5 1.5 0 014 18.5v-13zM16 9.5l4.5-3v11l-4.5-3" />,
  TEXT: <path d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-13zM8 8h8M8 12h8M8 16h5" />,
};

function KindIcon({ kind }: { kind: Kind }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {KIND_ICON[kind]}
    </svg>
  );
}

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

  const [kind, setKind] = useState<Kind>("FILE");
  const [title, setTitle] = useState("");
  const [subjectCode, setSubjectCode] = useState(subjects[0]?.code ?? "");
  const [classRoomId, setClassRoomId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [list, setList] = useState(items);
  const [openItem, setOpenItem] = useState<Material | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((m) => m.title.toLowerCase().includes(q));
  }, [list, search]);

  function resetFields() {
    setTitle("");
    setVideoUrl("");
    setTextContent("");
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function selectKind(k: Kind) {
    setKind(k);
    setError(null);
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("subjectCode", subjectCode);
    fd.append("kind", kind);
    if (classRoomId) fd.append("classRoomId", classRoomId);

    if (kind === "FILE" || kind === "PHOTO") {
      const file = fileRef.current?.files?.[0];
      if (!file) {
        setUploading(false);
        setError(tt.materials.errorPick);
        return;
      }
      fd.append("file", file);
    } else if (kind === "VIDEO") {
      fd.append("videoUrl", videoUrl);
    } else if (kind === "TEXT") {
      fd.append("textContent", textContent);
    }

    const res = await fetch("/api/teacher/materials", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === "invalid_video" ? tt.materials.errorVideo : tt.materials.errorGeneric);
      return;
    }
    resetFields();
    router.refresh();
  }

  async function remove(id: string) {
    setList((l) => l.filter((m) => m.id !== id));
    await fetch(`/api/teacher/materials/${id}`, { method: "DELETE" });
  }

  function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  const subjectName = (code: string | null) => subjects.find((s) => s.code === code)?.[lang === "ru" ? "nameRu" : "nameKk"];

  const KIND_TABS: { key: Kind; label: string }[] = [
    { key: "FILE", label: tt.materials.typeFile },
    { key: "PHOTO", label: tt.materials.typePhoto },
    { key: "VIDEO", label: tt.materials.typeVideo },
    { key: "TEXT", label: tt.materials.typeText },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.materials.title}</h1>
      <p className="text-ink-500 mt-1">{tt.materials.subtitle}</p>

      <form onSubmit={upload} className="card p-5 mt-6 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {KIND_TABS.map((k) => (
            <button
              type="button"
              key={k.key}
              onClick={() => selectKind(k.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                kind === k.key ? "bg-gold-500 border-gold-500 text-ink-900" : "border-ink-200 text-ink-600"
              }`}
            >
              <KindIcon kind={k.key} />
              {k.label}
            </button>
          ))}
        </div>

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

        {kind === "FILE" && (
          <>
            <label className="block text-xs text-ink-500">{tt.materials.chooseFile}</label>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.pptx,.xlsx,application/pdf" className="text-sm" />
          </>
        )}

        {kind === "PHOTO" && (
          <>
            <label className="block text-xs text-ink-500">{tt.materials.choosePhoto}</label>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" onChange={onPhotoSelected} />
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="mt-2 max-h-48 rounded-xl border border-ink-100 object-contain" />
            )}
          </>
        )}

        {kind === "VIDEO" && (
          <>
            <label className="block text-xs text-ink-500">{tt.materials.videoLinkLabel}</label>
            <input
              className="w-full h-11 rounded-xl border border-ink-200 px-4 focus:border-gold-500 outline-none"
              placeholder="https://youtube.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </>
        )}

        {kind === "TEXT" && (
          <>
            <label className="block text-xs text-ink-500">{tt.materials.textLabel}</label>
            <textarea
              className="w-full rounded-xl border border-ink-200 px-4 py-2.5 focus:border-gold-500 outline-none"
              rows={5}
              placeholder={tt.materials.textPlaceholder}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
          </>
        )}

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
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <MaterialCard key={m.id} m={m} lang={lang} tt={tt} subjectName={subjectName} onOpen={() => setOpenItem(m)} onRemove={() => remove(m.id)} />
          ))}
        </div>
      )}

      {openItem && <MaterialModal m={openItem} lang={lang} tt={tt} subjectName={subjectName} onClose={() => setOpenItem(null)} />}
    </div>
  );
}

function MaterialCard({
  m,
  lang,
  tt,
  subjectName,
  onOpen,
  onRemove,
}: {
  m: Material;
  lang: Lang;
  tt: ReturnType<typeof t>;
  subjectName: (code: string | null) => string | undefined;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const meta = [subjectName(m.subjectCode), m.classRoomName, m.teacherName].filter(Boolean).join(" · ");

  const body =
    m.kind === "PHOTO" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/api/files/material/${m.id}`} alt="" className="w-full h-32 object-cover rounded-xl mb-2.5" />
    ) : (
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
        m.kind === "VIDEO" ? "bg-red-50 text-red-500" : m.kind === "TEXT" ? "bg-gold-50 text-gold-600" : "bg-leaf-50 text-leaf-600"
      }`}>
        <KindIcon kind={m.kind} />
      </span>
    );

  return (
    <div className="card p-4">
      <button type="button" onClick={onOpen} className="text-left w-full">
        {body}
        <p className="font-semibold text-ink-800 truncate">{m.title}</p>
        <p className="text-xs text-ink-400 mt-0.5 truncate">{meta}</p>
      </button>
      {m.isMine && (
        <button onClick={onRemove} aria-label={tt.common.delete} className="text-ink-300 hover:text-red-500 transition-colors mt-2 text-xs font-semibold">
          {tt.common.delete}
        </button>
      )}
    </div>
  );
}

function MaterialModal({
  m,
  lang,
  tt,
  subjectName,
  onClose,
}: {
  m: Material;
  lang: Lang;
  tt: ReturnType<typeof t>;
  subjectName: (code: string | null) => string | undefined;
  onClose: () => void;
}) {
  const meta = [subjectName(m.subjectCode), m.classRoomName, m.teacherName].filter(Boolean).join(" · ");

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="font-display font-bold text-lg text-ink-900">{m.title}</p>
            <p className="text-xs text-ink-400 mt-0.5">{meta}</p>
          </div>
          <button onClick={onClose} aria-label={tt.common.close} className="w-9 h-9 rounded-full border border-ink-200 flex items-center justify-center text-ink-600 shrink-0">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>

        {m.kind === "PHOTO" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/files/material/${m.id}`} alt="" className="w-full rounded-xl" />
        )}
        {m.kind === "TEXT" && <p className="text-ink-700 leading-relaxed whitespace-pre-line">{m.textContent}</p>}
        {m.kind === "FILE" && (
          <a href={`/api/files/material/${m.id}`} target="_blank" rel="noopener" className="btn btn-primary h-11 px-6 text-sm">
            {tt.materials.openFile}
          </a>
        )}
        {m.kind === "VIDEO" && m.videoUrl && (
          <a href={m.videoUrl} target="_blank" rel="noopener" className="btn btn-primary h-11 px-6 text-sm">
            {tt.materials.openVideo}
          </a>
        )}
      </div>
    </div>
  );
}
