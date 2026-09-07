export const PACKAGE_PRICES: Record<string, number> = {
  STARTER: 18000,
  BUSINESS: 15000,
  ENTERPRISE: 0,
};

export const PACKAGE_TYPES = ["STARTER", "BUSINESS", "ENTERPRISE"] as const;

// Volume-tier pricing (TZ 2.3): the package and per-license price are derived
// from the license count, not chosen manually.
export function tierForLicenseCount(licenseCount: number): { packageType: (typeof PACKAGE_TYPES)[number]; pricePerLicense: number } {
  if (licenseCount >= 200) return { packageType: "ENTERPRISE", pricePerLicense: PACKAGE_PRICES.ENTERPRISE };
  if (licenseCount >= 50) return { packageType: "BUSINESS", pricePerLicense: PACKAGE_PRICES.BUSINESS };
  return { packageType: "STARTER", pricePerLicense: PACKAGE_PRICES.STARTER };
}
