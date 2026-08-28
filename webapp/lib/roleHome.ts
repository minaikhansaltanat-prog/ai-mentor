import type { Role } from "@prisma/client";

export function roleHomePath(role: Role) {
  switch (role) {
    case "STUDENT":
      return "/student/home";
    case "PARENT":
      return "/parent/dashboard";
    case "TEACHER":
      return "/teacher/classroom";
    case "SCHOOL_ADMIN":
      return "/school/admin";
    default:
      return "/login";
  }
}
