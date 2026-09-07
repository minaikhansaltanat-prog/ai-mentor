import { db } from "@/lib/db";

export const PACKAGE_PRICES: Record<string, number> = {
  STARTER: 18000,
  BUSINESS: 15000,
  ENTERPRISE: 0,
};

export const PACKAGE_TYPES = ["STARTER", "BUSINESS", "ENTERPRISE"] as const;

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
