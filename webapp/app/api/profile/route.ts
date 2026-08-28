import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { setLangCookie } from "@/lib/lang-server";

const schema = z.object({
  lastName: z.string().max(60).optional(),
  firstName: z.string().max(60).optional(),
  patronymic: z.string().max(60).optional(),
  birthDate: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  preferredLang: z.enum(["kk", "ru"]).optional(),
  favoriteSubjects: z.array(z.string()).optional(),
  teacherSubject: z.string().max(120).optional(),
  teacherCategory: z.string().max(120).optional(),
  notifyPush: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const data = parsed.data;

  const nameParts = [data.lastName, data.firstName, data.patronymic].filter(Boolean);

  await db.user.update({
    where: { id: session.userId },
    data: {
      lastName: data.lastName,
      firstName: data.firstName,
      patronymic: data.patronymic,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      email: data.email || undefined,
      preferredLang: data.preferredLang,
      favoriteSubjects: data.favoriteSubjects,
      teacherSubject: data.teacherSubject,
      teacherCategory: data.teacherCategory,
      notifyPush: data.notifyPush,
      notifyEmail: data.notifyEmail,
      ...(nameParts.length ? { name: nameParts.join(" ") } : {}),
    },
  });

  if (data.preferredLang) await setLangCookie(data.preferredLang);

  return NextResponse.json({ ok: true });
}
