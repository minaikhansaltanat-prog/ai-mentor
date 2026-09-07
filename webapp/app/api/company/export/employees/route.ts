import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "COMPANY_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!admin.companyId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const employees = await db.user.findMany({
    where: { companyId: admin.companyId, role: "PARENT" },
    include: { parentLinks: { where: { status: "APPROVED" } } },
    orderBy: { createdAt: "asc" },
  });

  const header = ["name", "phone", "children_count", "status", "joined_at"];
  const rows = employees.map((e) => [
    e.name,
    e.phone,
    String(e.parentLinks.length),
    e.parentLinks.length > 0 ? "ACTIVE" : "REGISTERED",
    e.createdAt.toISOString(),
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => csvEscape(v)).join(",")).join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="employees.csv"`,
    },
  });
}
