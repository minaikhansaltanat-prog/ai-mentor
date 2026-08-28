import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    include: {
      progress: { include: { topic: true } },
      chatSessions: { include: { messages: true } },
      homeworkStatuses: { include: { homework: true } },
      userAchievements: { include: { achievement: true } },
      works: true,
      materials: true,
      parentLinks: { include: { child: { select: { name: true, phone: true } } } },
      childLinks: { include: { parent: { select: { name: true, phone: true } } } },
    },
  });

  const { passwordHash: _passwordHash, ...safe } = user;
  void _passwordHash;

  return new NextResponse(JSON.stringify(safe, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ai-ustaz-data-${session.userId}.json"`,
    },
  });
}
