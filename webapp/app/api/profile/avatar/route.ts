import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile, deleteFile, makeKey } from "@/lib/storage";
import { validateFile, PHOTO_TYPES, PHOTO_MAX_BYTES } from "@/lib/uploadValidation";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });

  const check = validateFile({ type: file.type, size: file.size }, { allowed: PHOTO_TYPES, maxBytes: PHOTO_MAX_BYTES });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = makeKey("avatars", session.userId, "avatar.jpg");
  await uploadFile({ key, body: buffer, contentType: file.type });

  const prev = await db.user.findUnique({ where: { id: session.userId }, select: { avatarKey: true } });
  await db.user.update({ where: { id: session.userId }, data: { avatarKey: key } });
  if (prev?.avatarKey) await deleteFile(prev.avatarKey).catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const prev = await db.user.findUnique({ where: { id: session.userId }, select: { avatarKey: true } });
  await db.user.update({ where: { id: session.userId }, data: { avatarKey: null } });
  if (prev?.avatarKey) await deleteFile(prev.avatarKey).catch(() => {});

  return NextResponse.json({ ok: true });
}
