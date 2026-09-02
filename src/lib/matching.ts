import {
  canDonate,
  evaluateEligibility,
  formatDistance,
  haversineKm,
  type BloodGroup,
  type EligibilityResult,
  type GeoPoint,
  type Urgency,
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
  urgency?: Urgency; // used only for explanation copy, never relaxes rules
  sort?: "best" | "nearest";
}

export interface MatchBreakdown {
  compatibility: number; // out of 40
  proximity: number; // out of 25
  availability: number; // out of 20
  eligibility: number; // out of 15
}

export interface DonorMatch {
  donor: Donor;
  distanceKm: number;
  distanceLabel: string;
  compatible: boolean;
  eligibility: EligibilityResult;
  score: number; // transparent 0–100 match score
  breakdown: MatchBreakdown;
  reasons: string[];
  why: string[]; // human-readable "why this donor" bullets
  primaryReason: string;
  isBestMatch: boolean;
}

/**
 * Smart Match Engine weights — deterministic and rule-based.
 * Blood compatibility is a hard gate (incompatible donors are filtered out),
 * and contributes 40 points to every surviving match.
 * NOT medically validated or clinically predictive.
 */
export const MATCH_WEIGHTS = {
  compatibility: 40,
  proximity: 25,
  availability: 20,
  eligibility: 15,
} as const;

function scoreDonor(
  donor: Donor,
  distanceKm: number,
  eligibility: EligibilityResult,
  radiusKm: number,
): MatchBreakdown {
  return {
    compatibility: MATCH_WEIGHTS.compatibility,
    proximity: Math.round(
      MATCH_WEIGHTS.proximity * Math.max(0, 1 - distanceKm / Math.max(radiusKm, 1)),
    ),
    availability: donor.available ? MATCH_WEIGHTS.availability : 0,
    eligibility:
      eligibility.status === "eligible"
        ? MATCH_WEIGHTS.eligibility
        : eligibility.status === "recently-donated"
          ? 5
          : 0,
  };
}

function breakdownTotal(b: MatchBreakdown): number {
  return b.compatibility + b.proximity + b.availability + b.eligibility;
}

function primaryReason(b: MatchBreakdown): string {
  const entries: Array<[number, string]> = [
    [b.proximity, "Closest compatible donor"],
    [b.availability, "Available now"],
    [b.eligibility, "Eligible to donate"],
  ];
  entries.sort((a, c) => c[0] - a[0]);
  return entries[0]![1];
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
    urgency,
    sort = "best",
  } = filters;

  const matches = donors
    .map((donor): DonorMatch => {
      const distanceKm = Math.round(haversineKm(origin, { lat: donor.lat, lng: donor.lng }) * 10) / 10;
      const eligibility = evaluateEligibility({
        lastDonationDate: donor.lastDonationDate,
        available: donor.available,
      });
      const compatible = canDonate(donor.bloodGroup, recipientGroup);
      const breakdown = scoreDonor(donor, distanceKm, eligibility, radiusKm);

      const reasons: string[] = [];
      if (compatible) reasons.push("Compatible");
      if (eligibility.status === "eligible") reasons.push("Eligible");
      if (donor.available) reasons.push("Available");
      reasons.push(formatDistance(distanceKm));

      const why: string[] = [];
      if (compatible) why.push(`Compatible blood group (${donor.bloodGroup} → ${recipientGroup})`);
      if (eligibility.status === "eligible") why.push("Eligible to donate");
      else if (eligibility.status === "recently-donated") why.push(eligibility.detail);
      if (donor.available) why.push("Available now");
      why.push(`${formatDistance(distanceKm)} from the hospital`);
      if (donor.verified) why.push("Verified donor");
      if (donor.donations > 0) why.push(`${donor.donations} previous donation${donor.donations === 1 ? "" : "s"}`);
      if (urgency === "critical" && donor.avgResponseMinutes <= 30) {
        why.push("Fast responder — suitable for current urgency");
      }

      return {
        donor,
        distanceKm,
        distanceLabel: formatDistance(distanceKm),
        compatible,
        eligibility,
        score: breakdownTotal(breakdown),
        breakdown,
        reasons,
        why,
        primaryReason: primaryReason(breakdown),
        isBestMatch: false,
      };
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
