"use client";

import { useState } from "react";
import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";

type Item = {
  id: string;
  titleKk: string;
  titleRu: string;
  dueDate: string;
  state: "PENDING" | "IN_PROGRESS" | "DONE";
  topicId: string | null;
  customQuestionKk: string | null;
  customQuestionRu: string | null;
  hasCustomAnswer: boolean;
};

export default function HomeworkList({ lang, items }: { lang: Lang; items: Item[] }) {
  const tt = t(lang);
  const [list, setList] = useState(items);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function markDone(id: string) {
    setList((l) => l.map((it) => (it.id === id ? { ...it, state: "DONE" } : it)));
    await fetch(`/api/homework/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "DONE" }),
    });
  }

  async function submitAnswer(id: string) {
    setChecking(id);
    const res = await fetch(`/api/homework/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: answers[id] ?? "" }),
    });
    setChecking(null);
    if (!res.ok) return;
    const data = await res.json();
    setResults((r) => ({ ...r, [id]: data.correct }));
    if (data.correct) setList((l) => l.map((it) => (it.id === id ? { ...it, state: "DONE" } : it)));
  }

  const stateLabel = { PENDING: tt.homework.pending, IN_PROGRESS: tt.homework.pending, DONE: tt.homework.done };
  const stateColor = { PENDING: "bg-gold-100 text-gold-700", IN_PROGRESS: "bg-gold-100 text-gold-700", DONE: "bg-leaf-100 text-leaf-700" };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.homework.title}</h1>

      {list.length === 0 ? (
        <p className="text-ink-400 mt-8">{tt.homework.empty}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((item) => {
            const question = lang === "ru" ? item.customQuestionRu : item.customQuestionKk;
            const isOpen = open === item.id;
            return (
              <div key={item.id} className="card p-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-1 min-w-0 ${item.hasCustomAnswer && item.state !== "DONE" ? "cursor-pointer" : ""}`}
                    onClick={() => item.hasCustomAnswer && item.state !== "DONE" && setOpen(isOpen ? null : item.id)}
                  >
                    <p className="font-semibold text-ink-800">{lang === "ru" ? item.titleRu : item.titleKk}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {tt.homework.due}: {new Date(item.dueDate).toLocaleDateString(lang === "ru" ? "ru-RU" : "kk-KZ")}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${stateColor[item.state]}`}>{stateLabel[item.state]}</span>
                  {!item.hasCustomAnswer && item.state !== "DONE" && (
                    <button onClick={() => markDone(item.id)} className="text-xs font-semibold text-gold-600 hover:underline whitespace-nowrap shrink-0">
                      {tt.homework.markDone}
                    </button>
                  )}
                  {item.topicId && (
                    <Link href={`/student/lesson/${item.topicId}`} className="text-xs font-semibold text-ink-500 hover:text-gold-600 whitespace-nowrap shrink-0">
                      →
                    </Link>
                  )}
                </div>

                {item.hasCustomAnswer && isOpen && item.state !== "DONE" && (
                  <div className="mt-4 pt-4 border-t border-ink-100">
                    <p className="text-sm text-ink-700 mb-2">{question}</p>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm focus:border-gold-500 outline-none"
                        value={answers[item.id] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [item.id]: e.target.value }))}
                        placeholder={tt.lesson.yourAnswer}
                      />
                      <button
                        onClick={() => submitAnswer(item.id)}
                        disabled={checking === item.id || !answers[item.id]}
                        className="btn btn-primary h-10 px-4 text-sm disabled:opacity-60"
                      >
                        {tt.lesson.check}
                      </button>
                    </div>
                    {results[item.id] === false && <p className="text-sm text-red-500 mt-2">{tt.lesson.incorrect}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
