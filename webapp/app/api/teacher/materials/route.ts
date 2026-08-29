import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile, makeKey } from "@/lib/storage";
import { validateFile, DOC_TYPES, DOC_MAX_BYTES, PHOTO_TYPES, PHOTO_MAX_BYTES } from "@/lib/uploadValidation";

function isYoutubeOrVimeo(url: string) {
  return /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//.test(url);
}

const KINDS = ["FILE", "PHOTO", "VIDEO", "TEXT"] as const;
type Kind = (typeof KINDS)[number];

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
  const textContent = form?.get("textContent");
  const file = form?.get("file");
  const kindRaw = form?.get("kind");
  const kind: Kind = KINDS.includes(kindRaw as Kind) ? (kindRaw as Kind) : "FILE";

  if (typeof title !== "string" || !title.trim()) return NextResponse.json({ error: "invalid" }, { status: 400 });

  let fileKey: string | undefined;
  let fileType: string | undefined;
  let finalVideoUrl: string | undefined;
  let finalText: string | undefined;

  if (kind === "FILE" || kind === "PHOTO") {
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "no_content" }, { status: 400 });
    const opts = kind === "PHOTO" ? { allowed: PHOTO_TYPES, maxBytes: PHOTO_MAX_BYTES } : { allowed: DOC_TYPES, maxBytes: DOC_MAX_BYTES };
    const check = validateFile({ type: file.type, size: file.size }, opts);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    fileKey = makeKey("materials", session.userId, file.name || "file");
    await uploadFile({ key: fileKey, body: buffer, contentType: file.type });
    fileType = file.type;
  } else if (kind === "VIDEO") {
    if (typeof videoUrl !== "string" || !isYoutubeOrVimeo(videoUrl)) {
      return NextResponse.json({ error: "invalid_video" }, { status: 400 });
    }
    finalVideoUrl = videoUrl;
  } else if (kind === "TEXT") {
    if (typeof textContent !== "string" || !textContent.trim()) {
      return NextResponse.json({ error: "no_content" }, { status: 400 });
    }
    finalText = textContent.trim();
  }

  const material = await db.material.create({
    data: {
      teacherId: session.userId,
      schoolId: teacher.schoolId,
      classRoomId: typeof classRoomId === "string" && classRoomId ? classRoomId : undefined,
      subjectCode: typeof subjectCode === "string" && subjectCode ? subjectCode : undefined,
      title: title.trim(),
      kind,
      fileKey,
      fileType,
      videoUrl: finalVideoUrl,
      textContent: finalText,
      visibility: "SCHOOL",
    },
  });

  return NextResponse.json({ ok: true, id: material.id });
}
