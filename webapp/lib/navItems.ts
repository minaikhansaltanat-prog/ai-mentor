import type { Role } from "@prisma/client";
import type { Dict } from "@/lib/i18n";
import type { NavItem } from "@/components/AppShell";

export function navItemsForRole(role: Role, tt: Dict): NavItem[] {
  switch (role) {
    case "STUDENT":
      return [
        { href: "/student/home", label: tt.nav.home, icon: "home" },
        { href: "/student/ai-teacher", label: tt.nav.aiTeacher, icon: "chat" },
        { href: "/student/homework", label: tt.nav.homework, icon: "book" },
        { href: "/student/progress", label: tt.nav.progress, icon: "trend" },
        { href: "/student/profile", label: tt.nav.profile, icon: "user" },
      ];
    case "PARENT":
      return [{ href: "/parent/dashboard", label: tt.nav.dashboard, icon: "home" }];
    case "TEACHER":
      return [
        { href: "/teacher/classroom", label: tt.nav.classroom, icon: "users" },
        { href: "/teacher/materials", label: tt.nav.materials, icon: "book" },
      ];
    case "SCHOOL_ADMIN":
      return [{ href: "/school/admin", label: tt.nav.admin, icon: "school" }];
    default:
      return [];
  }
}
