import { useSyncExternalStore } from "react";
import type { BloodGroup } from "./blood";
import {
  CITY_CENTER,
  DEMO_DONORS,
  DEMO_REQUESTS,
  type BloodRequest,
  type Donor,
  type RequestStatus,
} from "./demo-data";

export type Role = "donor" | "seeker";

export interface AppUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  /** donor-only */
  donorId?: string;
}

export type AlertResponse = "pending" | "accepted" | "declined";

/**
 * A local/demo emergency alert. No real SMS, push or email is ever sent —
 * these records only drive the in-app donor response workflow.
 * Match data is a snapshot of the Smart Match Engine result at alert time.
 */
export interface EmergencyAlert {
  id: string;
  requestId: string;
  donorId: string;
  createdAt: string;
  response: AlertResponse;
  respondedAt: string | null;
  /** Smart Match Engine snapshot — never recomputed with another algorithm. */
  score: number;
  distanceKm: number;
  distanceLabel: string;
  why: string[];
  primaryReason: string;
}

/** A single demo tracking event ("Emergency activity" log entry). */
export interface TrackingEvent {
  at: string;
  label: string;
}

/**
 * Local/demo live-tracking record for one request. Stages are derived from the
 * existing request status + alerts; only the manual demo transitions
 * (en route / donation completed) are stored as an override.
 */
export interface TrackingRecord {
  override: "en_route" | "donation_completed" | null;
  timestamps: Partial<Record<string, string>>;
  events: TrackingEvent[];
}

interface AppState {
  user: AppUser | null;
  donors: Donor[];
  requests: BloodRequest[];
  /** requestId -> donorIds the seeker has personally invited */
  invites: Record<string, string[]>;
  alerts: EmergencyAlert[];
  /** requestId -> demo tracking record */
  tracking: Record<string, TrackingRecord>;
  nextRequestNumber: number;
}

const STORAGE_KEY = "bloodbridge.state.v3";

function initialState(): AppState {
  return {
    user: null,
    donors: DEMO_DONORS,
    requests: DEMO_REQUESTS,
    invites: {},
    alerts: [],
    tracking: {},
    nextRequestNumber: 1043,
  };
}

export const EMPTY_TRACKING: TrackingRecord = { override: null, timestamps: {}, events: [] };

function withTracking(
  s: AppState,
  requestId: string,
  patch: (rec: TrackingRecord) => TrackingRecord,
): Record<string, TrackingRecord> {
  const rec = s.tracking[requestId] ?? { override: null, timestamps: {}, events: [] };
  return { ...s.tracking, [requestId]: patch(rec) };
}

function stamp(
  rec: TrackingRecord,
  stage: string,
  label: string,
  at = new Date().toISOString(),
): TrackingRecord {
  return {
    ...rec,
    timestamps: { ...rec.timestamps, [stage]: rec.timestamps[stage] ?? at },
    events: [...rec.events, { at, label }],
  };
}


let state: AppState = initialState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — prototype keeps working in memory */
  }
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      state = { ...initialState(), ...parsed };
      emit();
    }
  } catch {
    /* ignore corrupt state */
  }
}

function setState(update: (prev: AppState) => AppState) {
  state = update(state);
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => state;
const serverSnapshot = initialState();
const getServerSnapshot = () => serverSnapshot;

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

export const useUser = () => useAppState((s) => s.user);
export const useDonors = () => useAppState((s) => s.donors);
export const useRequests = () => useAppState((s) => s.requests);
export const useInvites = () => useAppState((s) => s.invites);
export const useAlerts = () => useAppState((s) => s.alerts);


export function currentUser() {
  return state.user;
}

/* ---------------------------------- auth --------------------------------- */

export interface DonorSignup {
  bloodGroup: BloodGroup;
  area: string;
  lastDonationDate: string | null;
  available: boolean;
}

export function register(
  data: { role: Role; name: string; email: string; phone: string },
  donorData?: DonorSignup,
) {
  const id = `u-${Date.now()}`;
  if (data.role === "donor" && donorData) {
    const donorId = `me-${id}`;
    const donor: Donor = {
      id: donorId,
      name: data.name,
      bloodGroup: donorData.bloodGroup,
      area: donorData.area || "Banjara Hills",
      city: "Hyderabad",
      lat: CITY_CENTER.lat + 0.004,
      lng: CITY_CENTER.lng + 0.004,
      available: donorData.available,
      verified: false,
      lastDonationDate: donorData.lastDonationDate,
      donations: 0,
      avgResponseMinutes: 15,
      phone: data.phone,
    };
    setState((s) => ({
      ...s,
      donors: [donor, ...s.donors],
      user: { id, role: "donor", name: data.name, email: data.email, phone: data.phone, donorId },
    }));
  } else {
    setState((s) => ({
      ...s,
      user: { id, role: data.role, name: data.name, email: data.email, phone: data.phone },
    }));
  }
  return state.user!;
}

/** Prototype auth: no password verification against a backend. */
export function login(email: string, role: Role) {
  const existing = state.user;
  if (existing && existing.email.toLowerCase() === email.toLowerCase()) return existing;

  if (role === "donor") {
    const donor = state.donors[0]!;
    setState((s) => ({
      ...s,
      user: {
        id: "demo-donor",
        role: "donor",
        name: donor.name,
        email,
        phone: donor.phone,
        donorId: donor.id,
      },
    }));
  } else {
    setState((s) => ({
      ...s,
      user: { id: "s-demo", role: "seeker", name: "Meghana Rao", email, phone: "+91 98490 55501" },
    }));
  }
  return state.user!;
}

export function logout() {
  setState((s) => ({ ...s, user: null }));
}

export function updateProfile(patch: Partial<AppUser>) {
  setState((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
}

/* --------------------------------- donors -------------------------------- */

export function setDonorAvailability(donorId: string, available: boolean) {
  setState((s) => ({
    ...s,
    donors: s.donors.map((d) => (d.id === donorId ? { ...d, available } : d)),
  }));
}

export function updateDonor(donorId: string, patch: Partial<Donor>) {
  setState((s) => ({
    ...s,
    donors: s.donors.map((d) => (d.id === donorId ? { ...d, ...patch } : d)),
  }));
}

/* -------------------------------- requests -------------------------------- */

export interface NewRequestInput {
  bloodGroup: BloodGroup;
  units: number;
  hospital: string;
  area: string;
  lat: number;
  lng: number;
  requiredBy: string;
  urgency: BloodRequest["urgency"];
  notes?: string;
}

export function createRequest(input: NewRequestInput): BloodRequest {
  const user = state.user;
  const id = `BB-${state.nextRequestNumber}`;
  const request: BloodRequest = {
    ...input,
    id,
    seekerId: user?.id ?? "guest",
    seekerName: user?.name ?? "Guest seeker",
    status: "searching",
    createdAt: new Date().toISOString(),
    notifiedDonorIds: [],
    acceptedDonorIds: [],
  };
  setState((s) => ({
    ...s,
    requests: [request, ...s.requests],
    nextRequestNumber: s.nextRequestNumber + 1,
  }));
  return request;
}

export function notifyDonors(requestId: string, donorIds: string[]) {
  setState((s) => ({
    ...s,
    requests: s.requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: r.status === "searching" ? "notified" : r.status,
            notifiedDonorIds: Array.from(new Set([...r.notifiedDonorIds, ...donorIds])),
          }
        : r,
    ),
  }));
}

export function inviteDonor(requestId: string, donorId: string) {
  setState((s) => ({
    ...s,
    invites: { ...s.invites, [requestId]: Array.from(new Set([...(s.invites[requestId] ?? []), donorId])) },
    requests: s.requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: r.status === "searching" ? "notified" : r.status,
            notifiedDonorIds: Array.from(new Set([...r.notifiedDonorIds, donorId])),
          }
        : r,
    ),
  }));
}

export function acceptRequest(requestId: string, donorId: string) {
  setState((s) => ({
    ...s,
    alerts: s.alerts.map((a) =>
      a.requestId === requestId && a.donorId === donorId && a.response === "pending"
        ? { ...a, response: "accepted", respondedAt: new Date().toISOString() }
        : a,
    ),
    requests: s.requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: r.status === "fulfilled" ? r.status : "accepted",
            acceptedDonorIds: Array.from(new Set([...r.acceptedDonorIds, donorId])),
          }
        : r,
    ),
  }));
}

/* ----------------------------- emergency alerts ---------------------------- */

export interface EmergencyAlertInput {
  donorId: string;
  score: number;
  distanceKm: number;
  distanceLabel: string;
  why: string[];
  primaryReason: string;
}

/**
 * Creates local/demo emergency alerts from Smart Match Engine results.
 * Donors already alerted for this request are skipped. Returns created count.
 */
export function createEmergencyAlerts(requestId: string, inputs: EmergencyAlertInput[]): number {
  const existing = new Set(
    state.alerts.filter((a) => a.requestId === requestId).map((a) => a.donorId),
  );
  const fresh = inputs.filter((i) => !existing.has(i.donorId));
  if (fresh.length === 0) return 0;
  const now = new Date().toISOString();
  const created: EmergencyAlert[] = fresh.map((i) => ({
    id: `al-${requestId}-${i.donorId}`,
    requestId,
    donorId: i.donorId,
    createdAt: now,
    response: "pending",
    respondedAt: null,
    score: i.score,
    distanceKm: i.distanceKm,
    distanceLabel: i.distanceLabel,
    why: i.why,
    primaryReason: i.primaryReason,
  }));
  setState((s) => ({
    ...s,
    alerts: [...created, ...s.alerts],
    requests: s.requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: r.status === "searching" ? "notified" : r.status,
            notifiedDonorIds: Array.from(
              new Set([...r.notifiedDonorIds, ...created.map((c) => c.donorId)]),
            ),
          }
        : r,
    ),
  }));
  return created.length;
}

/** Donor accept/decline. Returns false when the alert is missing or already answered. */
export function respondToAlert(alertId: string, response: "accepted" | "declined"): boolean {
  const alert = state.alerts.find((a) => a.id === alertId);
  if (!alert || alert.response !== "pending") return false;
  const request = state.requests.find((r) => r.id === alert.requestId);
  if (!request || request.status === "cancelled") return false;
  const now = new Date().toISOString();
  setState((s) => ({
    ...s,
    alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, response, respondedAt: now } : a)),
    requests:
      response === "accepted"
        ? s.requests.map((r) =>
            r.id === alert.requestId
              ? {
                  ...r,
                  status: r.status === "fulfilled" ? r.status : "accepted",
                  acceptedDonorIds: Array.from(new Set([...r.acceptedDonorIds, alert.donorId])),
                }
              : r,
          )
        : s.requests,
  }));
  return true;
}

export interface AlertSummary {
  alerted: number;
  accepted: number;
  pending: number;
  declined: number;
}

export function summarizeAlerts(alerts: EmergencyAlert[], requestId: string): AlertSummary {
  const scoped = alerts.filter((a) => a.requestId === requestId);
  return {
    alerted: scoped.length,
    accepted: scoped.filter((a) => a.response === "accepted").length,
    pending: scoped.filter((a) => a.response === "pending").length,
    declined: scoped.filter((a) => a.response === "declined").length,
  };
}


export function setRequestStatus(requestId: string, status: RequestStatus) {
  setState((s) => ({
    ...s,
    requests: s.requests.map((r) => (r.id === requestId ? { ...r, status } : r)),
  }));
}

export function resetDemoData() {
  const user = state.user;
  state = { ...initialState(), user };
  persist();
  emit();
}
