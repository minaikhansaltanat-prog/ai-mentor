import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { navItemsForRole } from "@/lib/navItems";
import AppShell from "@/components/AppShell";
import AccountForm from "@/components/AccountForm";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const lang = await getLang();
  const tt = t(lang);

  const [user, unreadCount] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.userId } }),
    db.notification.count({ where: { userId: session.userId, read: false } }),
  ]);

  const subjects = await db.subject.findMany({
    where:
      session.role === "STUDENT"
        ? { gradeMin: { lte: user.grade ?? 7 }, gradeMax: { gte: user.grade ?? 7 } }
        : undefined,
    orderBy: { order: "asc" },
  });

  return (
    <AppShell
      lang={lang}
      userId={session.userId}
      name={session.name}
      hasAvatar={Boolean(user.avatarKey)}
      roleLabel={tt.roles[session.role]}
      navItems={navItemsForRole(session.role, tt)}
      unreadCount={unreadCount}
    >
      <AccountForm
        lang={lang}
        role={session.role}
        subjects={subjects.map((s) => ({ code: s.code, nameKk: s.nameKk, nameRu: s.nameRu }))}
        user={{
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          firstName: user.firstName,
          patronymic: user.patronymic,
          birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
          email: user.email,
          hasAvatar: Boolean(user.avatarKey),
          favoriteSubjects: user.favoriteSubjects,
          teacherSubject: user.teacherSubject,
          teacherCategory: user.teacherCategory,
          notifyPush: user.notifyPush,
          notifyEmail: user.notifyEmail,
        }}
      />
    </AppShell>
  );
}
