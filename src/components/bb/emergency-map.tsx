import { Ambulance, Building2, CheckCircle2, Droplet, MapPin } from "lucide-react";
import { Chip } from "@/components/bb/badges";
import { cn } from "@/lib/utils";
import type { BloodRequest, Donor } from "@/lib/demo-data";
import type { TrackingStage } from "@/lib/tracking";

/**
 * Emergency coordination map — DEMO / SIMULATED.
 * Renders seeded Hyderabad coordinates on a deterministic SVG canvas.
 * There is no GPS, no live location and no external map tiles.
 */

export interface MapDonorPoint {
  id: string;
  name: string;
  bloodGroup: string;
  lat: number;
  lng: number;
  distanceLabel: string;
  score: number;
}

const DONOR_STATUS: Partial<Record<TrackingStage, { label: string; tone: "info" | "warning" | "success" }>> = {
  confirmed: { label: "Accepted", tone: "info" },
  en_route: { label: "En Route", tone: "warning" },
  donation_completed: { label: "Donation Completed", tone: "success" },
  fulfilled: { label: "Fulfilled", tone: "success" },
};

function hasCoords(p: { lat?: number; lng?: number } | null | undefined) {
  return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
}

export function EmergencyMap({
  request,
  stage,
  confirmedDonor,
  confirmedScore,
  confirmedDistanceLabel,
  candidates = [],
  className,
}: {
  request: BloodRequest;
  stage: TrackingStage;
  confirmedDonor?: Donor | null;
  confirmedScore?: number | null;
  confirmedDistanceLabel?: string | null;
  candidates?: MapDonorPoint[];
  className?: string;
}) {
  const status = DONOR_STATUS[stage] ?? null;
  const hospitalOk = hasCoords(request);
  const donorOk = hasCoords(confirmedDonor);

  // Deterministic projection: fit all known points into a 100x100 canvas.
  const points = [
    ...(hospitalOk ? [{ lat: request.lat, lng: request.lng }] : []),
    ...(donorOk ? [{ lat: confirmedDonor!.lat, lng: confirmedDonor!.lng }] : []),
    ...candidates.filter(hasCoords).map((c) => ({ lat: c.lat, lng: c.lng })),
  ];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = points.length ? Math.min(...lats) : 0;
  const maxLat = points.length ? Math.max(...lats) : 0;
  const minLng = points.length ? Math.min(...lngs) : 0;
  const maxLng = points.length ? Math.max(...lngs) : 0;
  const spanLat = Math.max(maxLat - minLat, 0.01);
  const spanLng = Math.max(maxLng - minLng, 0.01);
  const pad = 18;
  const project = (lat: number, lng: number) => ({
    x: pad + ((lng - minLng) / spanLng) * (100 - pad * 2),
    y: 100 - pad - ((lat - minLat) / spanLat) * (100 - pad * 2),
  });

  const hospital = hospitalOk ? project(request.lat, request.lng) : null;
  const donor = donorOk ? project(confirmedDonor!.lat, confirmedDonor!.lng) : null;
  const progress =
    stage === "en_route" ? 0.5 : stage === "donation_completed" || stage === "fulfilled" ? 1 : 0;
  const vehicle =
    donor && hospital
      ? { x: donor.x + (hospital.x - donor.x) * progress, y: donor.y + (hospital.y - donor.y) * progress }
      : null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/25 bg-card/70 shadow-soft backdrop-blur",
        className,
      )}
    >
      {/* header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-primary/5 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            {request.urgency} emergency · {request.id}
          </p>
          <p className="truncate text-sm font-semibold">
            {request.bloodGroup} · {request.units} unit{request.units === 1 ? "" : "s"} ·{" "}
            {request.hospital}
          </p>
        </div>
        <Chip tone="neutral">Demo coordination map</Chip>
      </div>

      {!hospitalOk ? (
        <p className="p-6 text-sm text-muted-foreground">
          Location data is missing for this request, so the coordination map can’t be drawn.
        </p>
      ) : (
        <div className="relative">
          <svg
            viewBox="0 0 100 100"
            className="h-56 w-full sm:h-72"
            role="img"
            aria-label="Simulated emergency coordination map"
          >
            <defs>
              <pattern id="bb-emap-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path
                  d="M8 0H0V8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.25"
                  className="text-border"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#bb-emap-grid)" />

            {/* pulse rings around the hospital */}
            {[6, 12, 20].map((r) => (
              <circle
                key={r}
                cx={hospital!.x}
                cy={hospital!.y}
                r={r}
                fill="none"
                strokeWidth="0.35"
                strokeDasharray="1.5 1.5"
                className="stroke-primary/35"
              />
            ))}

            {/* unconfirmed candidate markers */}
            {!donor &&
              candidates.filter(hasCoords).map((c) => {
                const p = project(c.lat, c.lng);
                return (
                  <g key={c.id}>
                    <circle cx={p.x} cy={p.y} r="1.6" className="fill-muted-foreground/60" />
                    <title>{`${c.name} · ${c.bloodGroup} · ${c.distanceLabel}`}</title>
                  </g>
                );
              })}

            {/* demo route */}
            {donor && (
              <>
                <line
                  x1={donor.x}
                  y1={donor.y}
                  x2={hospital!.x}
                  y2={hospital!.y}
                  strokeWidth="0.9"
                  strokeDasharray="2.5 2"
                  strokeLinecap="round"
                  className="stroke-primary/70"
                />
                <circle cx={donor.x} cy={donor.y} r="3.4" className="fill-primary/15" />
                <circle cx={donor.x} cy={donor.y} r="1.9" className="fill-primary" />
                {vehicle && progress > 0 && (
                  <circle
                    cx={vehicle.x}
                    cy={vehicle.y}
                    r="1.5"
                    className="fill-warning stroke-background"
                    strokeWidth="0.4"
                  />
                )}
              </>
            )}

            {/* hospital marker */}
            <circle cx={hospital!.x} cy={hospital!.y} r="3.6" className="fill-primary/20" />
            <rect
              x={hospital!.x - 1.7}
              y={hospital!.y - 1.7}
              width="3.4"
              height="3.4"
              rx="0.7"
              className="fill-destructive"
            />
          </svg>

          {/* donor label overlay */}
          {donor && confirmedDonor && (
            <div className="pointer-events-none absolute left-3 top-3 max-w-[60%] rounded-xl border border-border/70 bg-background/90 p-2.5 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Donor
              </p>
              <p className="truncate text-sm font-bold">{confirmedDonor.name}</p>
              <p className="text-xs text-muted-foreground">
                {confirmedDonor.bloodGroup}
                {typeof confirmedScore === "number" ? ` · ${confirmedScore}/100` : ""}
                {confirmedDistanceLabel ? ` · ${confirmedDistanceLabel}` : ""}
              </p>
              {status && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  <Ambulance className="h-3 w-3" aria-hidden />
                  {status.label}
                </span>
              )}
            </div>
          )}

          <div className="pointer-events-none absolute bottom-3 right-3 rounded-xl border border-border/70 bg-background/90 p-2.5 text-right backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Hospital
            </p>
            <p className="flex items-center justify-end gap-1 text-sm font-bold">
              <Building2 className="h-3.5 w-3.5 text-destructive" aria-hidden />
              {request.area}
            </p>
          </div>
        </div>
      )}

      {/* footer status bar */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/70 px-4 py-3">
        {donor ? (
          <>
            <Chip tone={status?.tone ?? "info"}>
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Donor {status?.label ?? "Accepted"}
            </Chip>
            {confirmedDistanceLabel && (
              <Chip tone="neutral">
                <MapPin className="h-3 w-3" aria-hidden />
                {confirmedDistanceLabel} to hospital
              </Chip>
            )}
            {typeof confirmedScore === "number" && (
              <Chip tone="neutral">
                <Droplet className="h-3 w-3" aria-hidden />
                {confirmedScore}/100 match
              </Chip>
            )}
          </>
        ) : (
          <Chip tone="warning">
            No donor has confirmed yet
            {candidates.length > 0 ? ` · ${candidates.length} matched donor(s) shown` : ""}
          </Chip>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">
          Simulated locations · demo route · not live GPS
        </span>
      </div>
    </div>
  );
}
