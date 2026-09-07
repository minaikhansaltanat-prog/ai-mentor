import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  const { id } = await ctx.params;

  const employee = await db.user.findUnique({ where: { id } });
  if (!employee || employee.role !== "PARENT" || employee.companyId !== admin.companyId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await db.user.update({ where: { id }, data: { companyId: null } });
  return NextResponse.json({ ok: true });
}
