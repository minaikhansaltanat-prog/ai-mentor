import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile, makeKey } from "@/lib/storage";
import { validateFile, PHOTO_TYPES, DOC_TYPES, PHOTO_MAX_BYTES, DOC_MAX_BYTES } from "@/lib/uploadValidation";

const ALLOWED = [...PHOTO_TYPES, "application/pdf"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const title = form?.get("title");
  const visibility = form?.get("visibility");
  if (!file || !(file instanceof File) || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const isDoc = file.type === "application/pdf";
  const check = validateFile(
    { type: file.type, size: file.size },
    isDoc ? { allowed: DOC_TYPES, maxBytes: DOC_MAX_BYTES } : { allowed: PHOTO_TYPES, maxBytes: PHOTO_MAX_BYTES }
  );
  if (!ALLOWED.includes(file.type) || !check.ok) return NextResponse.json({ error: check.ok ? "type" : check.error }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = makeKey("works", session.userId, file.name || "file");
  await uploadFile({ key, body: buffer, contentType: file.type });

  const vis = ["PRIVATE", "TEACHER", "CLASS"].includes(String(visibility)) ? String(visibility) : "TEACHER";

  const work = await db.work.create({
    data: { studentId: session.userId, title: title.trim(), fileKey: key, fileType: file.type, visibility: vis as "PRIVATE" | "TEACHER" | "CLASS" },
  });

  return NextResponse.json({ ok: true, id: work.id });
}
