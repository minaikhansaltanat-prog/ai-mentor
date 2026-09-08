"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

type Post = { id: string; title: string; body: string; authorName: string; createdAt: string };

export default function CompanyBlog({ lang, posts }: { lang: Lang; posts: Post[] }) {
  const tt = t(lang);
  const [postList, setPostList] = useState(posts);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy("publish");
    const res = await fetch("/api/company/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    setBusy(null);
    if (res.ok) {
      const data = await res.json();
      setPostList((list) => [data.post, ...list]);
      setTitle("");
      setBody("");
    }
  }

  async function removePost(id: string) {
    setBusy(id);
    await fetch(`/api/company/blog/${id}`, { method: "DELETE" });
    setBusy(null);
    setPostList((list) => list.filter((p) => p.id !== id));
  }

  return (
    <div>
      <p className="text-xs font-bold text-ink-400 mb-3 uppercase tracking-wide">{tt.company.blogTitle}</p>
      <form onSubmit={submitPost} className="card p-4">
        <input
          type="text"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm focus:border-gold-500 outline-none"
          placeholder={tt.company.blogTitlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full h-24 rounded-xl border border-ink-200 px-3 py-2 text-sm focus:border-gold-500 outline-none resize-none mt-2"
          placeholder={tt.company.blogBodyPlaceholder}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={busy === "publish"}
            className="h-10 px-5 rounded-full bg-gold-500 text-ink-900 text-sm font-semibold hover:bg-gold-400 transition-colors disabled:opacity-60"
          >
            {tt.company.blogPublish}
          </button>
        </div>
      </form>

      {postList.length === 0 ? (
        <p className="text-ink-400 text-sm mt-3">{tt.company.blogEmpty}</p>
      ) : (
        <div className="space-y-2 mt-3">
          {postList.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display font-bold text-ink-900">{p.title}</p>
                <button
                  onClick={() => removePost(p.id)}
                  disabled={busy === p.id}
                  className="shrink-0 h-8 px-3 rounded-full border border-ink-200 text-xs font-semibold text-ink-500 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-60"
                >
                  {tt.company.blogDelete}
                </button>
              </div>
              <p className="text-sm text-ink-600 mt-1.5 whitespace-pre-wrap">{p.body}</p>
              <p className="text-xs text-ink-400 mt-2">
                {p.authorName} ·{" "}
                {new Date(p.createdAt).toLocaleString(lang === "kk" ? "kk-KZ" : "ru-RU", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
