/**
 * BloodBridge core domain logic.
 * PROTOTYPE ONLY — not medical advice. Rules are isolated here so they can be
 * replaced with clinically reviewed logic later.
 */

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

/** recipient -> donor groups whose red cells are compatible */
const RECIPIENT_CAN_RECEIVE_FROM: Record<BloodGroup, BloodGroup[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

export function compatibleDonorGroups(recipient: BloodGroup): BloodGroup[] {
  return RECIPIENT_CAN_RECEIVE_FROM[recipient];
}

export function canDonate(donor: BloodGroup, recipient: BloodGroup): boolean {
  return RECIPIENT_CAN_RECEIVE_FROM[recipient].includes(donor);
}

export function canDonateTo(donor: BloodGroup): BloodGroup[] {
  return BLOOD_GROUPS.filter((r) => canDonate(donor, r));
}

/* ------------------------------ eligibility ------------------------------ */

export const DONATION_COOLDOWN_DAYS = 90;

export type EligibilityStatus = "eligible" | "recently-donated" | "unavailable";

export interface EligibilityResult {
  status: EligibilityStatus;
  label: string;
  detail: string;
  daysUntilEligible: number;
}

export function daysSince(dateISO: string | null | undefined, now = Date.now()): number {
  if (!dateISO) return Number.POSITIVE_INFINITY;
  const then = new Date(dateISO).getTime();
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return Math.floor((now - then) / 86_400_000);
}

export function evaluateEligibility(input: {
  lastDonationDate: string | null;
  available: boolean;
  now?: number;
}): EligibilityResult {
  const elapsed = daysSince(input.lastDonationDate, input.now ?? Date.now());
  const remaining = Math.max(0, DONATION_COOLDOWN_DAYS - (Number.isFinite(elapsed) ? elapsed : DONATION_COOLDOWN_DAYS));

  if (remaining > 0) {
    return {
      status: "recently-donated",
      label: "Recently Donated",
      detail: `Eligible again in ${remaining} day${remaining === 1 ? "" : "s"}`,
      daysUntilEligible: remaining,
    };
  }
  if (!input.available) {
    return {
      status: "unavailable",
      label: "Unavailable",
      detail: "Donor has paused availability",
      daysUntilEligible: 0,
    };
  }
  return {
    status: "eligible",
    label: "Eligible",
    detail: Number.isFinite(elapsed)
      ? `Last donated ${elapsed} days ago`
      : "No donation recorded yet",
    daysUntilEligible: 0,
  };
}

/* -------------------------------- distance ------------------------------- */

export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in km (Haversine). Deterministic. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

export const RADIUS_OPTIONS = [5, 10, 25, 50] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

/* --------------------------------- urgency -------------------------------- */

export const URGENCIES = ["critical", "urgent", "normal"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const URGENCY_META: Record<Urgency, { label: string; dot: string; hint: string }> = {
  critical: { label: "Critical", dot: "🔴", hint: "Needed within hours" },
  urgent: { label: "Urgent", dot: "🟠", hint: "Needed within a day" },
  normal: { label: "Normal", dot: "🟡", hint: "Planned / scheduled" },
};
