import type { Lang } from "@/lib/i18n";

export const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function gradeLabel(grade: number, lang: Lang) {
  if (grade === 0) return lang === "ru" ? "0 (Подготовительный)" : "0 (Дайындық)";
  return String(grade);
}
