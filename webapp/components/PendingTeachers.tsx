"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

type Teacher = { id: string; name: string; phone: string; teacherSubject: string | null };

export default function PendingTeachers({ lang, items }: { lang: Lang; items: Teacher[] }) {
  const tt = t(lang);
  const [list, setList] = useState(items);
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(id: string) {
    setBusy(id);
    await fetch("/api/school/verify-teacher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: id }),
    });
    setBusy(null);
    setList((l) => l.filter((t) => t.id !== id));
  }

  if (list.length === 0) return <p className="text-ink-400 text-sm">{tt.school.noPending}</p>;

  return (
    <div className="space-y-2">
      {list.map((teacher) => (
        <div key={teacher.id} className="card p-4 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink-800 truncate">{teacher.name}</p>
            <p className="text-xs text-ink-400">{teacher.teacherSubject || teacher.phone}</p>
          </div>
          <button
            onClick={() => approve(teacher.id)}
            disabled={busy === teacher.id}
            className="h-9 px-4 rounded-full bg-leaf-500 text-white text-sm font-semibold hover:bg-leaf-600 transition-colors disabled:opacity-60 shrink-0"
          >
            {tt.school.approve}
          </button>
        </div>
      ))}
    </div>
  );
}
