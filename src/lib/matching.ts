import {
  canDonate,
  evaluateEligibility,
  formatDistance,
  haversineKm,
  type BloodGroup,
  type EligibilityResult,
  type GeoPoint,
} from "./blood";
import type { Donor } from "./demo-data";

export interface MatchFilters {
  recipientGroup: BloodGroup;
  origin: GeoPoint;
  radiusKm: number;
  donorGroups?: BloodGroup[]; // optional explicit blood-group filter
  onlyAvailable?: boolean;
  onlyEligible?: boolean;
  onlyVerified?: boolean;
  sort?: "best" | "nearest";
}

export interface DonorMatch {
  donor: Donor;
  distanceKm: number;
  distanceLabel: string;
  compatible: boolean;
  eligibility: EligibilityResult;
  score: number;
  reasons: string[];
  isBestMatch: boolean;
}

/**
 * Ranking weights — compatibility is a hard gate, everything else is scored.
 */
function scoreDonor(donor: Donor, distanceKm: number, eligibility: EligibilityResult, radiusKm: number) {
  let score = 0;
  if (eligibility.status === "eligible") score += 45;
  else if (eligibility.status === "recently-donated") score += 8;
  if (donor.available) score += 20;
  if (donor.verified) score += 8;
  score += Math.max(0, 22 * (1 - distanceKm / Math.max(radiusKm, 1)));
  score += Math.max(0, 10 - donor.avgResponseMinutes / 6);
  score += Math.min(8, donor.donations * 1.2);
  return Math.round(score * 10) / 10;
}

export function matchDonors(donors: Donor[], filters: MatchFilters): DonorMatch[] {
  const {
    recipientGroup,
    origin,
    radiusKm,
    donorGroups,
    onlyAvailable,
    onlyEligible,
    onlyVerified,
    sort = "best",
  } = filters;

  const matches = donors
    .map((donor) => {
      const distanceKm = Math.round(haversineKm(origin, { lat: donor.lat, lng: donor.lng }) * 10) / 10;
      const eligibility = evaluateEligibility({
        lastDonationDate: donor.lastDonationDate,
        available: donor.available,
      });
      const compatible = canDonate(donor.bloodGroup, recipientGroup);
      const reasons: string[] = [];
      if (compatible) reasons.push("Compatible");
      if (eligibility.status === "eligible") reasons.push("Eligible");
      if (donor.available) reasons.push("Available");
      reasons.push(formatDistance(distanceKm));
      return {
        donor,
        distanceKm,
        distanceLabel: formatDistance(distanceKm),
        compatible,
        eligibility,
        score: scoreDonor(donor, distanceKm, eligibility, radiusKm),
        reasons,
        isBestMatch: false,
      } as DonorMatch;
    })
    // Incompatible donors are never valid matches.
    .filter((m) => m.compatible)
    .filter((m) => m.distanceKm <= radiusKm)
    .filter((m) => (donorGroups?.length ? donorGroups.includes(m.donor.bloodGroup) : true))
    .filter((m) => (onlyAvailable ? m.donor.available : true))
    .filter((m) => (onlyEligible ? m.eligibility.status === "eligible" : true))
    .filter((m) => (onlyVerified ? m.donor.verified : true));

  matches.sort((a, b) => (sort === "nearest" ? a.distanceKm - b.distanceKm : b.score - a.score));
  let best: DonorMatch | undefined;
  for (const m of matches) if (!best || m.score > best.score) best = m;
  if (best) best.isBestMatch = true;
  return matches;
}

export function suggestWiderRadius(current: number): number | null {
  const ladder = [5, 10, 25, 50];
  const next = ladder.find((r) => r > current);
  return next ?? null;
}
