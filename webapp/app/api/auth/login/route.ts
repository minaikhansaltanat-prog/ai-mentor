import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { roleHomePath } from "@/lib/roleHome";

const schema = z.object({
  phone: z.string().min(6),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { phone: parsed.data.phone } });
  if (!user) return NextResponse.json({ error: "invalid" }, { status: 401 });

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "invalid" }, { status: 401 });

  await createSession({ userId: user.id, role: user.role, name: user.name });
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

  return NextResponse.json({ ok: true, redirect: roleHomePath(user.role) });
}
