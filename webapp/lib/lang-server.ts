import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

const LANG_COOKIE = "aiustaz_lang";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const v = store.get(LANG_COOKIE)?.value;
  return v === "ru" ? "ru" : "kk";
}

export async function setLangCookie(lang: Lang) {
  const store = await cookies();
  store.set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
