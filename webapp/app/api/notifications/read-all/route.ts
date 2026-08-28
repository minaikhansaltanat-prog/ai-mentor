import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await db.notification.updateMany({ where: { userId: session.userId, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
