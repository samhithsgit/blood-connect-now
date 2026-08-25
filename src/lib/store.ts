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

interface AppState {
  user: AppUser | null;
  donors: Donor[];
  requests: BloodRequest[];
  /** requestId -> donorIds the seeker has personally invited */
  invites: Record<string, string[]>;
  nextRequestNumber: number;
}

const STORAGE_KEY = "bloodbridge.state.v1";

function initialState(): AppState {
  return {
    user: null,
    donors: DEMO_DONORS,
    requests: DEMO_REQUESTS,
    invites: {},
    nextRequestNumber: 1043,
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
