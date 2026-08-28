"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Subject } from "@prisma/client";
import { t, type Lang } from "@/lib/i18n";

type Msg = { id: string; role: string; content: string };

export default function ChatView({ lang, subjects }: { lang: Lang; subjects: Subject[] }) {
  const tt = t(lang);
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get("subjectCode");
  const seed = searchParams.get("seed");
  const [subjectCode, setSubjectCode] = useState(initialSubject || subjects[0]?.code || "math");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mocked, setMocked] = useState(false);
  const seedSentRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat?subjectCode=${subjectCode}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages ?? []);
        if (seed && !seedSentRef.current) {
          seedSentRef.current = true;
          send(seed);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectCode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: "tmp-" + Date.now(), role: "user", content }]);
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectCode, message: content }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setMocked(Boolean(data.mocked));
    setMessages((m) => [...m, { id: "reply-" + Date.now(), role: "assistant", content: data.reply }]);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display font-bold text-2xl text-ink-900">{tt.aiTeacher.title}</h1>
        {mocked && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gold-100 text-gold-700 uppercase" title={tt.common.demoNote}>
            {tt.common.demoBadge}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {subjects.map((s) => (
          <button
            key={s.code}
            onClick={() => setSubjectCode(s.code)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors ${
              subjectCode === s.code ? "bg-gold-500 border-gold-500 text-ink-900" : "border-ink-200 text-ink-600 hover:border-gold-300"
            }`}
          >
            {lang === "ru" ? s.nameRu : s.nameKk}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
        {messages.length === 0 && !loading && <p className="text-ink-400 text-sm mt-6 text-center">{tt.aiTeacher.empty}</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
              m.role === "user" ? "ml-auto bg-gold-500 text-ink-900 rounded-tr-sm" : "bg-white shadow-card text-ink-700 rounded-tl-sm"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="bg-white shadow-card text-ink-400 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm w-fit">...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {[tt.aiTeacher.quickExplain, tt.aiTeacher.quickExample, tt.aiTeacher.quickCheck].map((chip) => (
          <button key={chip} onClick={() => send(chip)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-ink-200 text-ink-600 hover:border-gold-400">
            {chip}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2 bg-white rounded-full border border-ink-200 px-2 py-1.5"
      >
        <input
          className="flex-1 h-10 px-3 outline-none text-sm bg-transparent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tt.aiTeacher.placeholder}
        />
        <button type="submit" disabled={loading || !input.trim()} className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-ink-900 disabled:opacity-50 shrink-0">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M13 5l7 7-7 7" /></svg>
        </button>
      </form>
    </div>
  );
}
