"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { t, type Lang } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";

export type NavItem = {
  href: string;
  label: string;
  icon: "home" | "chat" | "book" | "trend" | "user" | "users" | "school";
};

const ICONS: Record<NavItem["icon"], React.ReactNode> = {
  home: (
    <path d="M4 11.5L12 4l8 7.5M6 10v9a1 1 0 001 1h3v-5a2 2 0 012-2v0a2 2 0 012 2v5h3a1 1 0 001-1v-9" />
  ),
  chat: <path d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v9a1.5 1.5 0 01-1.5 1.5H9l-4 4v-4H5.5A1.5 1.5 0 014 14.5v-9z" />,
  book: (
    <path d="M4 5.5A1.5 1.5 0 015.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13zM20 5.5A1.5 1.5 0 0018.5 4H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" />
  ),
  trend: <path d="M4 16l5-5 4 4 7-8M20 7h-4v4" />,
  user: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />,
  users: (
    <path d="M9 12a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15.5 6.5a3 3 0 010 5.8M20.5 20c0-2.8-2-5.2-4.7-5.8" />
  ),
  school: <path d="M12 3l9 5-9 5-9-5 9-5zM5 10.5V16c0 1.5 3 3 7 3s7-1.5 7-3v-5.5" />,
};

function Icon({ name, className }: { name: NavItem["icon"]; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

export default function AppShell({
  lang,
  name,
  roleLabel,
  navItems,
  children,
}: {
  lang: Lang;
  name: string;
  roleLabel: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const tt = t(lang);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-ink-100 bg-white/60 backdrop-blur-sm h-screen sticky top-0">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-ink-100">
          <span className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center font-display font-bold text-ink-900">A</span>
          <span className="font-display font-bold text-ink-900">{tt.appName}</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-semibold transition-colors ${
                  active ? "bg-gold-500 text-ink-900" : "text-ink-600 hover:bg-gold-50"
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-ink-100">
          <p className="text-xs text-ink-400">{roleLabel}</p>
          <p className="font-semibold text-ink-800 truncate">{name}</p>
          <div className="mt-3 flex items-center gap-2">
            <LangToggle lang={lang} label={tt.common.langToggle} />
            <button onClick={logout} className="h-10 px-3 rounded-full border border-ink-200 text-sm font-semibold text-ink-600 hover:border-red-300 hover:text-red-500 transition-colors">
              {tt.common.logout}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* mobile top bar */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-ink-100 bg-cream/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center font-display font-bold text-ink-900 text-sm">A</span>
            <span className="font-display font-bold text-ink-900 text-sm">{tt.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle lang={lang} label={tt.common.langToggle} />
            <button onClick={logout} aria-label={tt.common.logout} className="h-9 w-9 rounded-full border border-ink-200 flex items-center justify-center text-ink-600">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            </button>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-0">{children}</main>

        {/* mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-100 grid" style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center gap-1 py-2.5 ${active ? "text-gold-600" : "text-ink-400"}`}>
                <Icon name={item.icon} className="w-5.5 h-5.5" />
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
