import { NextRequest, NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { deleteFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    include: { works: true, materials: true },
  });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "wrong_password" }, { status: 400 });

  const keys = [
    user.avatarKey,
    ...user.works.map((w) => w.fileKey),
    ...user.materials.map((m) => m.fileKey),
  ].filter(Boolean) as string[];
  await Promise.all(keys.map((k) => deleteFile(k).catch(() => {})));

  await db.user.delete({ where: { id: session.userId } });
  await destroySession();

  return NextResponse.json({ ok: true });
}
