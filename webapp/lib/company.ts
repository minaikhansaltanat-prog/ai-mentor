import { db } from "@/lib/db";

export { PACKAGE_PRICES, PACKAGE_TYPES, tierForLicenseCount } from "@/lib/companyTiers";

// A license is "used" only once an employee's child link is actually approved —
// registering alone doesn't consume a seat.
export async function usedLicenseCount(companyId: string, excludeParentId?: string) {
  return db.user.count({
    where: {
      companyId,
      role: "PARENT",
      id: excludeParentId ? { not: excludeParentId } : undefined,
      parentLinks: { some: { status: "APPROVED" } },
    },
  });
}
