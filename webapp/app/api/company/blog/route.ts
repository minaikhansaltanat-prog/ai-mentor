import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!admin.companyId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.body === "string" ? body.body.trim() : "";
  if (!title || !content) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const post = await db.companyPost.create({
    data: { companyId: admin.companyId, authorName: admin.name, title, body: content },
  });
  await db.companyAuditLog.create({
    data: { companyId: admin.companyId, actorName: admin.name, action: "blog_post_added", meta: title },
  });

  return NextResponse.json({ ok: true, post });
}
