import { CITY_CENTER } from "@/lib/demo-data";
import type { DonorMatch } from "@/lib/matching";
import { cn } from "@/lib/utils";

/** Lightweight deterministic SVG map — no external tiles, works offline. */
export function CityMap({
  matches,
  radiusKm,
  origin = CITY_CENTER,
  selectedId,
  onSelect,
  className,
}: {
  matches: DonorMatch[];
  radiusKm: number;
  origin?: { lat: number; lng: number };
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const size = 100;
  const span = Math.max(radiusKm, 1) / 111; // degrees roughly covered by radius
  const project = (lat: number, lng: number) => ({
    x: size / 2 + ((lng - origin.lng) / (span * 2)) * size,
    y: size / 2 - ((lat - origin.lat) / (span * 2)) * size,
  });

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-surface", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" role="img" aria-label="Donor map">
        <defs>
          <pattern id="bb-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-border" />
          </pattern>
        </defs>
        <rect width={size} height={size} fill="url(#bb-grid)" />
        {[0.33, 0.66, 1].map((f) => (
          <circle
            key={f}
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) * f}
            fill="none"
            strokeDasharray="1.5 1.5"
            strokeWidth="0.3"
            className="stroke-primary/40"
          />
        ))}
        <circle cx={size / 2} cy={size / 2} r="1.8" className="fill-primary" />
        {matches.map((m) => {
          const p = project(m.donor.lat, m.donor.lng);
          const active = selectedId === m.donor.id;
          return (
            <g key={m.donor.id} onClick={() => onSelect?.(m.donor.id)} className="cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 2.6 : m.isBestMatch ? 2.2 : 1.6}
                className={cn(
                  m.eligibility.status === "eligible" ? "fill-success" : "fill-warning",
                  active && "stroke-foreground",
                )}
                strokeWidth="0.4"
              />
              <title>{`${m.donor.name} · ${m.donor.bloodGroup} · ${m.distanceLabel}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-background/85 px-2 py-1 text-[11px] text-muted-foreground">
        Rings: {(radiusKm / 3).toFixed(0)} / {(radiusKm * 0.66).toFixed(0)} / {radiusKm} km
      </div>
    </div>
  );
}
