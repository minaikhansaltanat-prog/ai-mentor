import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["TRIAL", "ACTIVE", "SUSPENDED", "CHURNED"];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "INTERNAL_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const company = await db.company.findUnique({ where: { id } });
  if (!company) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db.company.update({ where: { id }, data: { status } });
  const admin = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  await db.companyAuditLog.create({
    data: {
      companyId: id,
      actorName: `${admin.name} (internal)`,
      action: "status_changed",
      meta: `${company.status} -> ${status}`,
    },
  });

  return NextResponse.json({ ok: true, status });
}
