import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  password: z.string().min(4),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "INTERNAL_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { phone: parsed.data.phone } });
  if (existing) return NextResponse.json({ error: "phone_taken" }, { status: 409 });

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({
    data: { role: "INTERNAL_ADMIN", name: parsed.data.name, phone: parsed.data.phone, passwordHash },
  });

  return NextResponse.json({ ok: true, id: user.id });
}
