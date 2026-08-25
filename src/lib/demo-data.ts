import type { BloodGroup, Urgency } from "./blood";

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  area: string;
  city: string;
  lat: number;
  lng: number;
  available: boolean;
  verified: boolean;
  lastDonationDate: string | null;
  donations: number;
  avgResponseMinutes: number;
  /** Contact details are only revealed after a donor accepts a request. */
  phone: string;
}

export type RequestStatus = "searching" | "notified" | "accepted" | "fulfilled" | "cancelled";

export interface BloodRequest {
  id: string;
  seekerId: string;
  seekerName: string;
  patientAge?: number;
  bloodGroup: BloodGroup;
  units: number;
  hospital: string;
  area: string;
  lat: number;
  lng: number;
  requiredBy: string; // ISO
  urgency: Urgency;
  notes?: string;
  status: RequestStatus;
  createdAt: string;
  notifiedDonorIds: string[];
  acceptedDonorIds: string[];
}

/** Deterministic demo city centre (Hyderabad, Banjara Hills). */
export const CITY_CENTER = { lat: 17.4126, lng: 78.4392 };
export const CITY_NAME = "Hyderabad";

const day = 86_400_000;
/** Fixed reference so demo data does not drift between renders. */
const ago = (days: number) => new Date(Date.now() - days * day).toISOString().slice(0, 10);
const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

export const DEMO_DONORS: Donor[] = [
  { id: "d1", name: "Aarav Mehta", bloodGroup: "O-", area: "Banjara Hills", city: CITY_NAME, lat: 17.4156, lng: 78.4321, available: true, verified: true, lastDonationDate: ago(140), donations: 9, avgResponseMinutes: 8, phone: "+91 98490 11021" },
  { id: "d2", name: "Sneha Reddy", bloodGroup: "O+", area: "Jubilee Hills", city: CITY_NAME, lat: 17.4326, lng: 78.4071, available: true, verified: true, lastDonationDate: ago(210), donations: 6, avgResponseMinutes: 12, phone: "+91 98490 11022" },
  { id: "d3", name: "Karthik Iyer", bloodGroup: "A+", area: "Madhapur", city: CITY_NAME, lat: 17.4483, lng: 78.3915, available: true, verified: false, lastDonationDate: ago(35), donations: 3, avgResponseMinutes: 22, phone: "+91 98490 11023" },
  { id: "d4", name: "Fatima Khan", bloodGroup: "B+", area: "Mehdipatnam", city: CITY_NAME, lat: 17.3953, lng: 78.4392, available: true, verified: true, lastDonationDate: ago(120), donations: 11, avgResponseMinutes: 6, phone: "+91 98490 11024" },
  { id: "d5", name: "Rohan Deshmukh", bloodGroup: "AB+", area: "Ameerpet", city: CITY_NAME, lat: 17.4374, lng: 78.4487, available: false, verified: true, lastDonationDate: ago(300), donations: 4, avgResponseMinutes: 30, phone: "+91 98490 11025" },
  { id: "d6", name: "Priya Nair", bloodGroup: "A-", area: "Somajiguda", city: CITY_NAME, lat: 17.4239, lng: 78.4573, available: true, verified: true, lastDonationDate: ago(95), donations: 7, avgResponseMinutes: 10, phone: "+91 98490 11026" },
  { id: "d7", name: "Vikram Singh", bloodGroup: "O+", area: "Begumpet", city: CITY_NAME, lat: 17.4435, lng: 78.4645, available: true, verified: false, lastDonationDate: null, donations: 0, avgResponseMinutes: 40, phone: "+91 98490 11027" },
  { id: "d8", name: "Ananya Rao", bloodGroup: "B-", area: "Kukatpally", city: CITY_NAME, lat: 17.4948, lng: 78.3996, available: true, verified: true, lastDonationDate: ago(180), donations: 5, avgResponseMinutes: 18, phone: "+91 98490 11028" },
  { id: "d9", name: "Imran Sheikh", bloodGroup: "O-", area: "Charminar", city: CITY_NAME, lat: 17.3616, lng: 78.4747, available: true, verified: true, lastDonationDate: ago(410), donations: 12, avgResponseMinutes: 15, phone: "+91 98490 11029" },
  { id: "d10", name: "Meera Joshi", bloodGroup: "AB-", area: "Secunderabad", city: CITY_NAME, lat: 17.4399, lng: 78.4983, available: false, verified: true, lastDonationDate: ago(60), donations: 2, avgResponseMinutes: 26, phone: "+91 98490 11030" },
  { id: "d11", name: "Dev Patel", bloodGroup: "A+", area: "Gachibowli", city: CITY_NAME, lat: 17.4401, lng: 78.3489, available: true, verified: true, lastDonationDate: ago(160), donations: 8, avgResponseMinutes: 9, phone: "+91 98490 11031" },
  { id: "d12", name: "Nisha Verma", bloodGroup: "B+", area: "Kondapur", city: CITY_NAME, lat: 17.4615, lng: 78.3649, available: true, verified: false, lastDonationDate: ago(75), donations: 1, avgResponseMinutes: 35, phone: "+91 98490 11032" },
  { id: "d13", name: "Sanjay Kulkarni", bloodGroup: "O+", area: "Lakdikapul", city: CITY_NAME, lat: 17.4009, lng: 78.4626, available: true, verified: true, lastDonationDate: ago(102), donations: 10, avgResponseMinutes: 7, phone: "+91 98490 11033" },
  { id: "d14", name: "Tara D'Souza", bloodGroup: "A-", area: "Tolichowki", city: CITY_NAME, lat: 17.3999, lng: 78.4079, available: true, verified: true, lastDonationDate: ago(25), donations: 4, avgResponseMinutes: 14, phone: "+91 98490 11034" },
  { id: "d15", name: "Harish Babu", bloodGroup: "AB+", area: "Uppal", city: CITY_NAME, lat: 17.3980, lng: 78.5590, available: true, verified: false, lastDonationDate: ago(230), donations: 3, avgResponseMinutes: 28, phone: "+91 98490 11035" },
  { id: "d16", name: "Lakshmi Prasad", bloodGroup: "B+", area: "Dilsukhnagar", city: CITY_NAME, lat: 17.3687, lng: 78.5247, available: true, verified: true, lastDonationDate: ago(133), donations: 6, avgResponseMinutes: 16, phone: "+91 98490 11036" },
  { id: "d17", name: "Zoya Ahmed", bloodGroup: "O-", area: "Masab Tank", city: CITY_NAME, lat: 17.4025, lng: 78.4487, available: false, verified: true, lastDonationDate: ago(190), donations: 7, avgResponseMinutes: 11, phone: "+91 98490 11037" },
  { id: "d18", name: "Arjun Menon", bloodGroup: "A+", area: "Panjagutta", city: CITY_NAME, lat: 17.4256, lng: 78.4497, available: true, verified: true, lastDonationDate: ago(88), donations: 5, avgResponseMinutes: 13, phone: "+91 98490 11038" },
  { id: "d19", name: "Ritika Shah", bloodGroup: "AB-", area: "Miyapur", city: CITY_NAME, lat: 17.4968, lng: 78.3577, available: true, verified: false, lastDonationDate: ago(320), donations: 2, avgResponseMinutes: 33, phone: "+91 98490 11039" },
  { id: "d20", name: "Gopal Krishna", bloodGroup: "B-", area: "Sanathnagar", city: CITY_NAME, lat: 17.4562, lng: 78.4335, available: true, verified: true, lastDonationDate: ago(150), donations: 9, avgResponseMinutes: 10, phone: "+91 98490 11040" },
];

export const HOSPITALS = [
  { name: "Apollo Hospitals, Jubilee Hills", area: "Jubilee Hills", lat: 17.4239, lng: 78.4118 },
  { name: "Yashoda Hospitals, Somajiguda", area: "Somajiguda", lat: 17.4265, lng: 78.4577 },
  { name: "KIMS Hospital, Minister Road", area: "Secunderabad", lat: 17.4408, lng: 78.4884 },
  { name: "NIMS, Punjagutta", area: "Panjagutta", lat: 17.4270, lng: 78.4489 },
  { name: "Osmania General Hospital", area: "Afzal Gunj", lat: 17.3730, lng: 78.4747 },
  { name: "Care Hospitals, Banjara Hills", area: "Banjara Hills", lat: 17.4149, lng: 78.4373 },
];

export const DEMO_REQUESTS: BloodRequest[] = [
  {
    id: "BB-1042",
    seekerId: "s-demo",
    seekerName: "Meghana Rao",
    patientAge: 34,
    bloodGroup: "O+",
    units: 2,
    hospital: "Apollo Hospitals, Jubilee Hills",
    area: "Jubilee Hills",
    lat: 17.4239,
    lng: 78.4118,
    requiredBy: inHours(5),
    urgency: "critical",
    notes: "Post-partum haemorrhage. Attendant available at reception desk B.",
    status: "notified",
    createdAt: new Date(Date.now() - 40 * 60_000).toISOString(),
    notifiedDonorIds: ["d2", "d13", "d1", "d9"],
    acceptedDonorIds: [],
  },
  {
    id: "BB-1041",
    seekerId: "s-demo2",
    seekerName: "Ibrahim Qureshi",
    patientAge: 58,
    bloodGroup: "B+",
    units: 1,
    hospital: "Yashoda Hospitals, Somajiguda",
    area: "Somajiguda",
    lat: 17.4265,
    lng: 78.4577,
    requiredBy: inHours(20),
    urgency: "urgent",
    notes: "Scheduled dialysis support transfusion.",
    status: "accepted",
    createdAt: new Date(Date.now() - 5 * 3_600_000).toISOString(),
    notifiedDonorIds: ["d4", "d16", "d12"],
    acceptedDonorIds: ["d4"],
  },
  {
    id: "BB-1039",
    seekerId: "s-demo3",
    seekerName: "Ravi Teja",
    patientAge: 27,
    bloodGroup: "A-",
    units: 3,
    hospital: "NIMS, Punjagutta",
    area: "Panjagutta",
    lat: 17.427,
    lng: 78.4489,
    requiredBy: inHours(30),
    urgency: "normal",
    notes: "Elective orthopaedic surgery on Thursday morning.",
    status: "searching",
    createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    notifiedDonorIds: [],
    acceptedDonorIds: [],
  },
  {
    id: "BB-1028",
    seekerId: "s-demo",
    seekerName: "Meghana Rao",
    bloodGroup: "O+",
    units: 1,
    hospital: "Care Hospitals, Banjara Hills",
    area: "Banjara Hills",
    lat: 17.4149,
    lng: 78.4373,
    requiredBy: new Date(Date.now() - 6 * day).toISOString(),
    urgency: "urgent",
    status: "fulfilled",
    createdAt: new Date(Date.now() - 7 * day).toISOString(),
    notifiedDonorIds: ["d2", "d13"],
    acceptedDonorIds: ["d13"],
  },
];
