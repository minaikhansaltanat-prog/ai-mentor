import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

function parseEntries(text: string): { phone: string; name?: string }[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [phoneRaw, ...rest] = line.split(",");
      const phone = phoneRaw.trim();
      const name = rest.join(",").trim() || undefined;
      return { phone, name };
    })
    .filter((e) => e.phone.length >= 6);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!admin.companyId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";
  const entries = parseEntries(text);
  if (entries.length === 0) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  let created = 0;
  let skipped = 0;
  for (const entry of entries) {
    const alreadyEmployee = await db.user.findFirst({ where: { phone: entry.phone, companyId: admin.companyId } });
    if (alreadyEmployee) {
      skipped++;
      continue;
    }
    try {
      await db.employeeInvite.create({
        data: { companyId: admin.companyId, phone: entry.phone, name: entry.name },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, created, skipped });
}
