import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, EmptyState } from "@/components/bb/page";
import { DonorCard } from "@/components/bb/donor-card";
import { CityMap } from "@/components/bb/city-map";
import { BLOOD_GROUPS, RADIUS_OPTIONS, type BloodGroup } from "@/lib/blood";
import { CITY_CENTER, CITY_NAME } from "@/lib/demo-data";
import { matchDonors, suggestWiderRadius } from "@/lib/matching";
import { useDonors } from "@/lib/store";

export const Route = createFileRoute("/find-donors")({
  head: () => ({
    meta: [
      { title: "Find Blood Donors Nearby — BloodBridge" },
      {
        name: "description",
        content:
          "Search compatible, eligible and available blood donors near your hospital by blood group and radius.",
      },
      { property: "og:title", content: "Find Blood Donors Nearby — BloodBridge" },
      {
        property: "og:description",
        content: "Filter donors by blood group, radius, eligibility and verification.",
      },
    ],
  }),
  component: FindDonors,
});

function FindDonors() {
  const donors = useDonors();
  const [group, setGroup] = useState<BloodGroup>("O+");
  const [radius, setRadius] = useState<number>(10);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sort, setSort] = useState<"best" | "nearest">("best");
  const [selected, setSelected] = useState<string | null>(null);

  const matches = useMemo(
    () =>
      matchDonors(donors, {
        recipientGroup: group,
        origin: CITY_CENTER,
        radiusKm: radius,
        onlyAvailable,
        onlyEligible,
        onlyVerified,
        sort,
      }),
    [donors, group, radius, onlyAvailable, onlyEligible, onlyVerified, sort],
  );

  const wider = suggestWiderRadius(radius);

  return (
    <div className="shell pb-20">
      <PageHeader
        eyebrow={`${CITY_NAME} network`}
        title="Find compatible donors"
        description="Results are gated by real ABO/Rh compatibility, then ranked by distance, eligibility, availability and response speed."
        actions={
          <Button asChild>
            <Link to="/request/new">Create request</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card className="gap-4 p-5 shadow-soft lg:sticky lg:top-20">
            <div className="grid gap-2">
              <Label>Patient blood group</Label>
              <Select value={group} onValueChange={(v) => setGroup(v as BloodGroup)}>
                <SelectTrigger>
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
              <Label>Search radius</Label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <Button
                    key={r}
                    type="button"
                    size="sm"
                    variant={radius === r ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setRadius(r)}
                  >
                    {r} km
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Sort by</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as "best" | "nearest")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best match</SelectItem>
                  <SelectItem value="nearest">Nearest first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <Toggle label="Available only" checked={onlyAvailable} onChange={setOnlyAvailable} />
              <Toggle label="Eligible only" checked={onlyEligible} onChange={setOnlyEligible} />
              <Toggle label="Verified only" checked={onlyVerified} onChange={setOnlyVerified} />
            </div>
          </Card>

          <CityMap
            matches={matches}
            radiusKm={radius}
            selectedId={selected}
            onSelect={setSelected}
            className="hidden aspect-square lg:block"
          />
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" aria-hidden />
            {matches.length} compatible donor{matches.length === 1 ? "" : "s"} within {radius} km
          </div>

          {matches.length === 0 ? (
            <EmptyState
              title="No donors match yet"
              description="Try widening the radius or relaxing the filters — compatibility is never relaxed."
              action={
                wider ? (
                  <Button onClick={() => setRadius(wider)}>Expand to {wider} km</Button>
                ) : (
                  <Button variant="outline" onClick={() => setOnlyAvailable(false)}>
                    Include unavailable donors
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.map((m) => (
                <DonorCard
                  key={m.donor.id}
                  match={m}
                  className={selected === m.donor.id ? "ring-2 ring-ring" : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
