import { requireRole } from "@/lib/requireRole";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { navItemsForRole } from "@/lib/navItems";
import AppShell from "@/components/AppShell";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("SCHOOL_ADMIN");
  const lang = await getLang();
  const tt = t(lang);

  const [user, unreadCount] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { avatarKey: true } }),
    db.notification.count({ where: { userId: session.userId, read: false } }),
  ]);

  return (
    <AppShell
      lang={lang}
      userId={session.userId}
      name={session.name}
      hasAvatar={Boolean(user.avatarKey)}
      roleLabel={tt.roles.SCHOOL_ADMIN}
      navItems={navItemsForRole("SCHOOL_ADMIN", tt)}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
