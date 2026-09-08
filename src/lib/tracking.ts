import type { BloodRequest } from "./demo-data";
import type { EmergencyAlert, TrackingRecord } from "./store";

/**
 * Live emergency tracking — prototype simulation.
 * Stages are DERIVED from the existing request status, emergency alerts and
 * the demo tracking record. There is no second request system, no GPS and no
 * real-time infrastructure behind these values.
 */
export type TrackingStage =
  | "created"
  | "matching"
  | "alerted"
  | "confirmed"
  | "en_route"
  | "donation_completed"
  | "fulfilled";

export const TRACKING_STAGES: TrackingStage[] = [
  "created",
  "matching",
  "alerted",
  "confirmed",
  "en_route",
  "donation_completed",
  "fulfilled",
];

export const TRACKING_LABEL: Record<TrackingStage, string> = {
  created: "Request Created",
  matching: "Smart Matching",
  alerted: "Donors Alerted",
  confirmed: "Donor Confirmed",
  en_route: "Donor En Route",
  donation_completed: "Donation Completed",
  fulfilled: "Request Fulfilled",
};

/** Short badge text used on dashboard cards. */
export const TRACKING_BADGE: Record<TrackingStage, string> = {
  created: "REQUEST CREATED",
  matching: "SMART MATCHING",
  alerted: "DONORS NOTIFIED",
  confirmed: "DONOR CONFIRMED",
  en_route: "DONOR EN ROUTE",
  donation_completed: "DONATION COMPLETED",
  fulfilled: "FULFILLED",
};

export function stageIndex(stage: TrackingStage) {
  return TRACKING_STAGES.indexOf(stage);
}

export function deriveStage(
  request: BloodRequest,
  alerts: EmergencyAlert[],
  record?: TrackingRecord,
): TrackingStage {
  if (request.status === "fulfilled") return "fulfilled";
  if (record?.override === "donation_completed") return "donation_completed";
  if (record?.override === "en_route") return "en_route";

  const scoped = alerts.filter((a) => a.requestId === request.id);
  if (request.acceptedDonorIds.length > 0 || scoped.some((a) => a.response === "accepted"))
    return "confirmed";
  if (scoped.length > 0 || request.notifiedDonorIds.length > 0 || request.status === "notified")
    return "alerted";
  return "matching";
}

/** The next demo transition the seeker/hospital may perform, if any. */
export function nextSeekerAction(
  stage: TrackingStage,
): { stage: "en_route" | "donation_completed" | "fulfilled"; label: string } | null {
  if (stage === "confirmed") return { stage: "en_route", label: "Mark Donor En Route" };
  if (stage === "en_route")
    return { stage: "donation_completed", label: "Mark Donation Completed" };
  if (stage === "donation_completed")
    return { stage: "fulfilled", label: "Mark Request Fulfilled" };
  return null;
}
