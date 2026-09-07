import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { tierForLicenseCount, usedLicenseCount } from "@/lib/company";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY_ADMIN") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await db.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!admin.companyId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const licenseCount = Number(body?.licenseCount);
  if (!Number.isInteger(licenseCount) || licenseCount < 1 || licenseCount > 10000) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const company = await db.company.findUniqueOrThrow({ where: { id: admin.companyId } });
  const used = await usedLicenseCount(company.id);
  if (licenseCount < used) {
    return NextResponse.json({ error: "below_used", used }, { status: 409 });
  }

  const tier = tierForLicenseCount(licenseCount);
  await db.company.update({
    where: { id: company.id },
    data: { licenseCount, packageType: tier.packageType, pricePerLicense: tier.pricePerLicense },
  });

  const tierChanged = tier.packageType !== company.packageType;
  await db.companyAuditLog.create({
    data: {
      companyId: company.id,
      actorName: admin.name,
      action: "license_count_changed",
      meta: tierChanged
        ? `${company.licenseCount} -> ${licenseCount} (${company.packageType} -> ${tier.packageType})`
        : `${company.licenseCount} -> ${licenseCount}`,
    },
  });

  return NextResponse.json({ ok: true, licenseCount, packageType: tier.packageType });
}
