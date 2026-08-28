import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import AppShell, { type NavItem } from "@/components/AppShell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("STUDENT");
  const lang = await getLang();
  const tt = t(lang);

  const navItems: NavItem[] = [
    { href: "/student/home", label: tt.nav.home, icon: "home" },
    { href: "/student/ai-teacher", label: tt.nav.aiTeacher, icon: "chat" },
    { href: "/student/homework", label: tt.nav.homework, icon: "book" },
    { href: "/student/progress", label: tt.nav.progress, icon: "trend" },
    { href: "/student/profile", label: tt.nav.profile, icon: "user" },
  ];

  return (
    <AppShell lang={lang} name={session.name} roleLabel={tt.roles.STUDENT} navItems={navItems}>
      {children}
    </AppShell>
  );
}
