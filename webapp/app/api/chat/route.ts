import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { askAiTeacher, type ChatTurn } from "@/lib/ai";
import { getLang } from "@/lib/lang-server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const subjectCode = req.nextUrl.searchParams.get("subjectCode") ?? "math";
  const chatSession = await db.chatSession.findFirst({
    where: { studentId: session.userId, subjectCode },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ messages: chatSession?.messages ?? [], sessionId: chatSession?.id ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const subjectCode = typeof body?.subjectCode === "string" ? body.subjectCode : "math";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "empty" }, { status: 400 });

  const lang = await getLang();

  let chatSession = await db.chatSession.findFirst({
    where: { studentId: session.userId, subjectCode },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!chatSession) {
    chatSession = await db.chatSession.create({
      data: { studentId: session.userId, subjectCode, title: message.slice(0, 40) },
      include: { messages: true },
    });
  }

  await db.chatMessage.create({ data: { sessionId: chatSession.id, role: "user", content: message } });

  const history: ChatTurn[] = chatSession.messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const subjectRow = await db.subject.findUnique({ where: { code: subjectCode } });
  const subjectLabel = subjectRow ? (lang === "ru" ? subjectRow.nameRu : subjectRow.nameKk) : subjectCode;

  const { reply, mocked } = await askAiTeacher({ lang, subjectLabel, history, message });

  await db.chatMessage.create({ data: { sessionId: chatSession.id, role: "assistant", content: reply } });

  return NextResponse.json({ reply, mocked, sessionId: chatSession.id });
}
