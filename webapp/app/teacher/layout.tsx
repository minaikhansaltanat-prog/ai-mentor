import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import AppShell, { type NavItem } from "@/components/AppShell";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("TEACHER");
  const lang = await getLang();
  const tt = t(lang);

  const navItems: NavItem[] = [{ href: "/teacher/classroom", label: tt.nav.classroom, icon: "users" }];

  return (
    <AppShell lang={lang} name={session.name} roleLabel={tt.roles.TEACHER} navItems={navItems}>
      {children}
    </AppShell>
  );
}
