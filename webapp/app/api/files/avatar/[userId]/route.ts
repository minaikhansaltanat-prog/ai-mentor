import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile } from "@/lib/storage";

export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { userId } = await ctx.params;
  const user = await db.user.findUnique({ where: { id: userId }, select: { avatarKey: true } });
  if (!user?.avatarKey) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const file = await readFile(user.avatarKey);
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new NextResponse(Buffer.from(file.body), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
