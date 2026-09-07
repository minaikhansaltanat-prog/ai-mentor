import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { generateJoinCode } from "@/lib/codes";
import { roleHomePath } from "@/lib/roleHome";
import { requestChildLink } from "@/lib/parentLink";

const schema = z.object({
  role: z.enum(["STUDENT", "PARENT", "TEACHER", "SCHOOL_ADMIN", "COMPANY_ADMIN"]),
  name: z.string().min(2),
  phone: z.string().min(6),
  password: z.string().min(4),
  grade: z.number().int().min(0).max(11).optional(),
  classCode: z.string().optional(),
  childPhone: z.string().optional(),
  schoolName: z.string().optional(),
  schoolCode: z.string().optional(),
  companyName: z.string().optional(),
  companyCode: z.string().optional(),
  licenseCount: z.number().int().min(1).max(10000).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { phone: data.phone } });
  if (existing) {
    return NextResponse.json({ error: "phone_taken" }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);

  let schoolId: string | undefined;
  let classRoomId: string | undefined;
  let companyId: string | undefined;
  let grade = data.grade;
  let createdSchoolCode: string | undefined;
  let createdCompanyCode: string | undefined;

  if (data.role === "STUDENT") {
    if (data.classCode) {
      const cls = await db.classRoom.findUnique({ where: { joinCode: data.classCode.toUpperCase() } });
      if (!cls) return NextResponse.json({ error: "code_invalid" }, { status: 400 });
      classRoomId = cls.id;
      schoolId = cls.schoolId;
      grade = cls.grade;
    }
  } else if (data.role === "TEACHER") {
    if (!data.schoolCode) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const school = await db.school.findUnique({ where: { joinCode: data.schoolCode.toUpperCase() } });
    if (!school) return NextResponse.json({ error: "code_invalid" }, { status: 400 });
    schoolId = school.id;
  } else if (data.role === "SCHOOL_ADMIN") {
    if (!data.schoolName) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const joinCode = generateJoinCode();
    const school = await db.school.create({ data: { name: data.schoolName, joinCode } });
    schoolId = school.id;
    createdSchoolCode = joinCode;
  } else if (data.role === "COMPANY_ADMIN") {
    if (!data.companyName) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const joinCode = generateJoinCode();
    const company = await db.company.create({
      data: { name: data.companyName, joinCode, licenseCount: data.licenseCount ?? 50 },
    });
    companyId = company.id;
    createdCompanyCode = joinCode;
  } else if (data.role === "PARENT" && data.companyCode) {
    const company = await db.company.findUnique({
      where: { joinCode: data.companyCode.toUpperCase() },
      include: { _count: { select: { employees: { where: { role: "PARENT" } } } } },
    });
    if (!company) return NextResponse.json({ error: "code_invalid" }, { status: 400 });
    if (company._count.employees >= company.licenseCount) {
      return NextResponse.json({ error: "company_full" }, { status: 409 });
    }
    companyId = company.id;
  }

  const user = await db.user.create({
    data: {
      role: data.role,
      name: data.name,
      phone: data.phone,
      passwordHash,
      grade: data.role === "STUDENT" ? grade : undefined,
      schoolId,
      classRoomId,
      companyId,
    },
  });

  if (data.role === "PARENT" && data.childPhone) {
    await requestChildLink(user.id, user.name, data.childPhone).catch(() => {});
  }

  await createSession({ userId: user.id, role: user.role, name: user.name });

  return NextResponse.json({
    ok: true,
    redirect: roleHomePath(user.role),
    schoolCode: createdSchoolCode,
    companyCode: createdCompanyCode,
  });
}
