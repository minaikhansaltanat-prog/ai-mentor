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
};

export default function HomeworkList({ lang, items }: { lang: Lang; items: Item[] }) {
  const tt = t(lang);
  const [list, setList] = useState(items);

  async function markDone(id: string) {
    setList((l) => l.map((it) => (it.id === id ? { ...it, state: "DONE" } : it)));
    await fetch(`/api/homework/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "DONE" }),
    });
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
          {list.map((item) => (
            <div key={item.id} className="card p-5 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-ink-800">{lang === "ru" ? item.titleRu : item.titleKk}</p>
                <p className="text-xs text-ink-400 mt-0.5">
                  {tt.homework.due}: {new Date(item.dueDate).toLocaleDateString(lang === "ru" ? "ru-RU" : "kk-KZ")}
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stateColor[item.state]}`}>{stateLabel[item.state]}</span>
              {item.state !== "DONE" && (
                <button onClick={() => markDone(item.id)} className="text-xs font-semibold text-gold-600 hover:underline whitespace-nowrap">
                  {tt.homework.markDone}
                </button>
              )}
              {item.topicId && (
                <Link href={`/student/lesson/${item.topicId}`} className="text-xs font-semibold text-ink-500 hover:text-gold-600 whitespace-nowrap">
                  →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
