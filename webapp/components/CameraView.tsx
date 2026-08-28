"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

export default function CameraView({ lang }: { lang: Lang }) {
  const tt = t(lang);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [recognized, setRecognized] = useState<string | null>(null);
  const [mocked, setMocked] = useState(false);
  const [hideAnswer, setHideAnswer] = useState(true);
  const [loading, setLoading] = useState(false);

  function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, base64] = result.split(",");
        const mediaType = meta.match(/data:(.*);base64/)?.[1] ?? file.type;
        resolve({ base64, mediaType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setRecognized(null);
    setLoading(true);
    const { base64, mediaType } = await fileToBase64(file);
    const res = await fetch("/api/camera", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, mediaType }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setRecognized(data.recognized);
    setMocked(Boolean(data.mocked));
  }

  function askAiTeacher() {
    if (!recognized) return;
    const seed = encodeURIComponent(recognized);
    router.push(`/student/ai-teacher?seed=${seed}&subjectCode=math`);
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.camera.title}</h1>

      <div className="card p-6 mt-5 text-center">
        {preview ? (
          <img src={preview} alt="" className="w-full max-h-80 object-contain rounded-xl mb-4" />
        ) : (
          <div className="border-2 border-dashed border-ink-200 rounded-2xl py-14 mb-4 text-ink-400">
            <svg viewBox="0 0 24 24" width="40" height="40" className="mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 8.5A1.5 1.5 0 015.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0120 8.5v9A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5v-9z" />
              <circle cx="12" cy="13" r="3.4" />
            </svg>
            <p className="text-sm">{tt.camera.upload}</p>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        <button onClick={() => fileRef.current?.click()} className="btn btn-primary h-11 px-6">
          {tt.camera.choose}
        </button>

        {loading && <p className="text-sm text-ink-500 mt-4">{tt.camera.recognizing}</p>}

        {recognized && (
          <div className="mt-6 text-left">
            {mocked && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gold-100 text-gold-700 uppercase mb-3 inline-block" title={tt.common.demoNote}>
                {tt.common.demoBadge}
              </span>
            )}
            <p className="text-xs font-bold text-ink-400 uppercase tracking-wide">{tt.camera.recognized}</p>
            <p className="font-display font-bold text-xl text-ink-900 mt-1">{recognized}</p>

            <label className="flex items-center gap-2 mt-4 text-sm text-ink-600">
              <input type="checkbox" checked={hideAnswer} onChange={(e) => setHideAnswer(e.target.checked)} className="w-4 h-4 accent-gold-500" />
              {tt.camera.hideAnswer}
            </label>

            <button onClick={askAiTeacher} className="btn btn-primary h-11 px-6 mt-4">
              {tt.camera.askAbout}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
