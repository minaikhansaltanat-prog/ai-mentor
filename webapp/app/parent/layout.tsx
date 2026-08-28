import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import AppShell, { type NavItem } from "@/components/AppShell";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("PARENT");
  const lang = await getLang();
  const tt = t(lang);

  const navItems: NavItem[] = [{ href: "/parent/dashboard", label: tt.nav.dashboard, icon: "home" }];

  return (
    <AppShell lang={lang} name={session.name} roleLabel={tt.roles.PARENT} navItems={navItems}>
      {children}
    </AppShell>
  );
}
