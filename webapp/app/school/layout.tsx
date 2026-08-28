import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import AppShell, { type NavItem } from "@/components/AppShell";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("SCHOOL_ADMIN");
  const lang = await getLang();
  const tt = t(lang);

  const navItems: NavItem[] = [{ href: "/school/admin", label: tt.nav.admin, icon: "school" }];

  return (
    <AppShell lang={lang} name={session.name} roleLabel={tt.roles.SCHOOL_ADMIN} navItems={navItems}>
      {children}
    </AppShell>
  );
}
