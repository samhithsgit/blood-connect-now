import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/bb/page";
import { CityMap } from "@/components/bb/city-map";
import { DonorCard } from "@/components/bb/donor-card";
import { BLOOD_GROUPS, RADIUS_OPTIONS, type BloodGroup } from "@/lib/blood";
import { CITY_CENTER, CITY_NAME } from "@/lib/demo-data";
import { matchDonors } from "@/lib/matching";
import { useDonors } from "@/lib/store";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Donor Map — BloodBridge" },
      {
        name: "description",
        content: "Visualise compatible blood donors around your hospital by radius on the BloodBridge map.",
      },
      { property: "og:title", content: "Donor Map — BloodBridge" },
      { property: "og:description", content: "See where compatible donors are, by distance ring." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const donors = useDonors();
  const [group, setGroup] = useState<BloodGroup>("O+");
  const [radius, setRadius] = useState<number>(25);
  const [selected, setSelected] = useState<string | null>(null);

  const matches = useMemo(
    () => matchDonors(donors, { recipientGroup: group, origin: CITY_CENTER, radiusKm: radius }),
    [donors, group, radius],
  );
  const selectedMatch = matches.find((m) => m.donor.id === selected) ?? matches[0];

  return (
    <div className="shell pb-20">
      <PageHeader
        eyebrow={`${CITY_NAME} coverage`}
        title="Donor map"
        description="Distance rings are centred on the demo hospital location. Tap a dot to inspect the donor."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="gap-4 p-5 shadow-soft">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label>Patient group</Label>
              <Select value={group} onValueChange={(v) => setGroup(v as BloodGroup)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Radius</Label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={radius === r ? "default" : "outline"}
                    onClick={() => setRadius(r)}
                  >
                    {r} km
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <CityMap
            matches={matches}
            radiusKm={radius}
            selectedId={selected}
            onSelect={setSelected}
            className="aspect-square w-full"
          />
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <Legend className="bg-primary" label="Hospital / you" />
            <Legend className="bg-success" label="Eligible donor" />
            <Legend className="bg-warning" label="In cooldown or paused" />
          </div>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            {matches.length} compatible donors in range
          </h2>
          {selectedMatch ? (
            <DonorCard match={selectedMatch} />
          ) : (
            <Card className="p-6 text-sm text-muted-foreground">
              No compatible donors inside {radius} km. Try a larger radius.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} aria-hidden />
      {label}
    </span>
  );
}
