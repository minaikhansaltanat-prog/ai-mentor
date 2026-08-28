"use client";

import { useState } from "react";
import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";

type Item = {
  id: string;
  type: string;
  titleKk: string;
  titleRu: string;
  bodyKk: string;
  bodyRu: string;
  linkUrl: string | null;
  refId: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationList({ lang, items }: { lang: Lang; items: Item[] }) {
  const tt = t(lang);
  const [list, setList] = useState(items);
  const [responded, setResponded] = useState<Record<string, "approved" | "rejected">>({});

  async function markAllRead() {
    setList((l) => l.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  async function respond(item: Item, approve: boolean) {
    if (!item.refId) return;
    await fetch(`/api/parent-link/${item.refId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve }),
    });
    setResponded((r) => ({ ...r, [item.id]: approve ? "approved" : "rejected" }));
    setList((l) => l.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-ink-900">{tt.notif.title}</h1>
        {list.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-sm font-semibold text-gold-600 hover:underline">
            {tt.notif.markAllRead}
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="text-ink-400 mt-8">{tt.notif.empty}</p>
      ) : (
        <div className="mt-6 space-y-2.5">
          {list.map((n) => {
            const title = lang === "ru" ? n.titleRu : n.titleKk;
            const body = lang === "ru" ? n.bodyRu : n.bodyKk;
            const isLinkRequest = n.type === "link_request" && !responded[n.id];
            const content = (
              <div className={`card p-4 ${!n.read ? "border-l-4 border-gold-500" : ""}`}>
                <p className="font-semibold text-ink-800">{title}</p>
                {body && <p className="text-sm text-ink-500 mt-0.5">{body}</p>}
                <p className="text-xs text-ink-400 mt-1">{new Date(n.createdAt).toLocaleString(lang === "ru" ? "ru-RU" : "kk-KZ")}</p>

                {isLinkRequest && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => respond(n, true)}
                      className="h-9 px-4 rounded-full bg-leaf-500 text-white text-sm font-semibold hover:bg-leaf-600 transition-colors"
                    >
                      {tt.notif.approve}
                    </button>
                    <button
                      onClick={() => respond(n, false)}
                      className="h-9 px-4 rounded-full border border-ink-200 text-ink-600 text-sm font-semibold hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      {tt.notif.reject}
                    </button>
                  </div>
                )}
                {responded[n.id] === "approved" && <p className="text-sm text-leaf-600 mt-2">{tt.notif.linkApproved}</p>}
                {responded[n.id] === "rejected" && <p className="text-sm text-ink-400 mt-2">{tt.notif.linkRejected}</p>}
              </div>
            );

            return n.linkUrl && !isLinkRequest ? (
              <Link key={n.id} href={n.linkUrl} className="block">
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
