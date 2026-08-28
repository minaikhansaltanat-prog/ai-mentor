"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";

type Student = { id: string; name: string; avg: number };
type TopicStat = { titleKk: string; titleRu: string; avg: number };
type Topic = { id: string; titleKk: string; titleRu: string };
type ClassRoom = { id: string; name: string; joinCode: string };

export default function ClassroomView({
  lang,
  classRoom,
  students,
  topicStats,
  topics,
}: {
  lang: Lang;
  classRoom: ClassRoom | null;
  students: Student[];
  topicStats: TopicStat[];
  topics: Topic[];
}) {
  const tt = t(lang);
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("7");
  const [creating, setCreating] = useState(false);

  const [hwTitle, setHwTitle] = useState("");
  const [hwTopic, setHwTopic] = useState(topics[0]?.id ?? "");
  const [hwDue, setHwDue] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(false);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/teacher/class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, grade: Number(grade) }),
    });
    setCreating(false);
    router.refresh();
  }

  async function assignHomework(e: React.FormEvent) {
    e.preventDefault();
    setAssigning(true);
    await fetch("/api/teacher/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleKk: hwTitle, titleRu: hwTitle, topicId: hwTopic, dueDate: hwDue || undefined }),
    });
    setAssigning(false);
    setAssigned(true);
    setHwTitle("");
    router.refresh();
  }

  if (!classRoom) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display font-bold text-2xl text-ink-900">{tt.teacher.title}</h1>
        <p className="text-ink-400 mt-2 mb-6">{tt.teacher.noClass}</p>
        <form onSubmit={createClass} className="card p-6 space-y-4">
          <input
            className="w-full h-12 rounded-xl border border-ink-200 px-4 focus:border-gold-500 outline-none"
            placeholder="7А"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <select className="w-full h-12 rounded-xl border border-ink-200 px-4" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {[5, 6, 7, 8, 9, 10, 11].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button disabled={creating || !name} className="btn btn-primary w-full h-12 disabled:opacity-60">
            {creating ? tt.common.loading : tt.common.save}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-display font-bold text-2xl text-ink-900">{classRoom.name}</h1>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gold-100 text-gold-700">
          {tt.teacher.classCode}: {classRoom.joinCode}
        </span>
      </div>

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.teacher.students}</p>
      {students.length === 0 ? (
        <p className="text-ink-400 text-sm">—</p>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <div key={s.id} className="card p-4 flex items-center gap-3">
              <span className="flex-1 font-semibold text-ink-800">{s.name}</span>
              <div className="w-32 h-1.5 rounded-full bg-ink-100 hidden sm:block">
                <div className="h-1.5 rounded-full bg-gold-500" style={{ width: `${s.avg}%` }} />
              </div>
              <span className="text-sm font-bold text-ink-600 w-10 text-right">{s.avg}%</span>
            </div>
          ))}
        </div>
      )}

      {topicStats.length > 0 && (
        <>
          <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.teacher.problemTopics}</p>
          <div className="space-y-2">
            {topicStats.map((ts, i) => (
              <div key={i} className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 flex justify-between text-sm">
                <span className="text-ink-700">{lang === "ru" ? ts.titleRu : ts.titleKk}</span>
                <span className="font-bold text-red-500">{ts.avg}%</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-xs font-bold text-ink-400 mt-8 mb-3 uppercase tracking-wide">{tt.teacher.assignHomework}</p>
      <form onSubmit={assignHomework} className="card p-5 space-y-3">
        <input
          className="w-full h-11 rounded-xl border border-ink-200 px-4 focus:border-gold-500 outline-none"
          placeholder={tt.teacher.assignHomework}
          value={hwTitle}
          onChange={(e) => setHwTitle(e.target.value)}
          required
        />
        <select className="w-full h-11 rounded-xl border border-ink-200 px-4" value={hwTopic} onChange={(e) => setHwTopic(e.target.value)}>
          {topics.map((tp) => (
            <option key={tp.id} value={tp.id}>
              {lang === "ru" ? tp.titleRu : tp.titleKk}
            </option>
          ))}
        </select>
        <input type="date" className="w-full h-11 rounded-xl border border-ink-200 px-4" value={hwDue} onChange={(e) => setHwDue(e.target.value)} />
        <button disabled={assigning || !hwTitle} className="btn btn-primary h-11 px-6 disabled:opacity-60">
          {assigning ? tt.common.loading : tt.common.save}
        </button>
        {assigned && <p className="text-sm text-leaf-600">✓</p>}
      </form>
    </div>
  );
}
