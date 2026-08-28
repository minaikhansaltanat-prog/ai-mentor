import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile, makeKey } from "@/lib/storage";
import { validateFile, DOC_TYPES, DOC_MAX_BYTES } from "@/lib/uploadValidation";

function isYoutubeOrVimeo(url: string) {
  return /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//.test(url);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const teacher = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!teacher.teacherVerified) return NextResponse.json({ error: "not_verified" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const title = form?.get("title");
  const subjectCode = form?.get("subjectCode");
  const classRoomId = form?.get("classRoomId");
  const videoUrl = form?.get("videoUrl");
  const file = form?.get("file");

  if (typeof title !== "string" || !title.trim()) return NextResponse.json({ error: "invalid" }, { status: 400 });

  let fileKey: string | undefined;
  let fileType: string | undefined;

  if (file instanceof File && file.size > 0) {
    const check = validateFile({ type: file.type, size: file.size }, { allowed: DOC_TYPES, maxBytes: DOC_MAX_BYTES });
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    fileKey = makeKey("materials", session.userId, file.name || "file");
    await uploadFile({ key: fileKey, body: buffer, contentType: file.type });
    fileType = file.type;
  } else if (typeof videoUrl === "string" && videoUrl) {
    if (!isYoutubeOrVimeo(videoUrl)) return NextResponse.json({ error: "invalid_video" }, { status: 400 });
  } else {
    return NextResponse.json({ error: "no_content" }, { status: 400 });
  }

  const material = await db.material.create({
    data: {
      teacherId: session.userId,
      schoolId: teacher.schoolId,
      classRoomId: typeof classRoomId === "string" && classRoomId ? classRoomId : undefined,
      subjectCode: typeof subjectCode === "string" && subjectCode ? subjectCode : undefined,
      title: title.trim(),
      fileKey,
      fileType,
      videoUrl: typeof videoUrl === "string" && videoUrl ? videoUrl : undefined,
      visibility: "SCHOOL",
    },
  });

  return NextResponse.json({ ok: true, id: material.id });
}
