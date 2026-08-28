import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { navItemsForRole } from "@/lib/navItems";
import AppShell from "@/components/AppShell";
import NotificationList from "@/components/NotificationList";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const lang = await getLang();
  const tt = t(lang);

  const [user, notifications] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { avatarKey: true } }),
    db.notification.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <AppShell
      lang={lang}
      userId={session.userId}
      name={session.name}
      hasAvatar={Boolean(user.avatarKey)}
      roleLabel={tt.roles[session.role]}
      navItems={navItemsForRole(session.role, tt)}
      unreadCount={notifications.filter((n) => !n.read).length}
    >
      <NotificationList
        lang={lang}
        items={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          titleKk: n.titleKk,
          titleRu: n.titleRu,
          bodyKk: n.bodyKk,
          bodyRu: n.bodyRu,
          linkUrl: n.linkUrl,
          refId: n.refId,
          read: n.read,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </AppShell>
  );
}
