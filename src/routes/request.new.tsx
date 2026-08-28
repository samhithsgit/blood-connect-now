import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/bb/page";
import { RequireAuth } from "@/components/bb/require-auth";
import { BLOOD_GROUPS, URGENCIES, URGENCY_META, type BloodGroup, type Urgency } from "@/lib/blood";
import { CITY_CENTER, HOSPITALS } from "@/lib/demo-data";
import { createRequest } from "@/lib/store";

export const Route = createFileRoute("/request/new")({
  head: () => ({
    meta: [
      { title: "Create an Emergency Blood Request — BloodBridge" },
      {
        name: "description",
        content:
          "Raise a blood request with group, units, hospital and urgency so compatible donors nearby are matched instantly.",
      },
      { property: "og:title", content: "Create an Emergency Blood Request — BloodBridge" },
      {
        property: "og:description",
        content: "Post a request and reach ranked, compatible donors in your city.",
      },
    ],
  }),
  component: NewRequestRoute,
});

function NewRequestRoute() {
  return (
    <RequireAuth>
      <NewRequestForm />
    </RequireAuth>
  );
}

const OTHER = "__other__";

function defaultRequiredBy() {
  const d = new Date(Date.now() + 6 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function NewRequestForm() {
  const navigate = useNavigate();
  const [group, setGroup] = useState<BloodGroup>("O+");
  const [units, setUnits] = useState("2");
  const [urgency, setUrgency] = useState<Urgency>("critical");
  const [hospitalChoice, setHospitalChoice] = useState<string>(HOSPITALS[0]!.name);
  const [customHospital, setCustomHospital] = useState("");
  const [customArea, setCustomArea] = useState("");
  const [requiredBy, setRequiredBy] = useState(defaultRequiredBy());
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isOther = hospitalChoice === OTHER;

  function validate() {
    const next: Record<string, string> = {};
    const unitCount = Number(units);
    if (!Number.isFinite(unitCount) || unitCount < 1 || unitCount > 10) {
      next['units'] = "Enter between 1 and 10 units.";
    }
    if (isOther) {
      if (customHospital.trim().length < 3) next['hospital'] = "Enter the hospital name.";
      if (customArea.trim().length < 2) next['area'] = "Enter the area or locality.";
    }
    if (!requiredBy) next['requiredBy'] = "Choose when the blood is needed.";
    else if (new Date(requiredBy).getTime() < Date.now() - 60_000) {
      next['requiredBy'] = "The required-by time must be in the future.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    const preset = HOSPITALS.find((h) => h.name === hospitalChoice);
    const request = createRequest({
      bloodGroup: group,
      units: Number(units),
      hospital: isOther ? customHospital.trim() : preset!.name,
      area: isOther ? customArea.trim() : preset!.area,
      lat: isOther ? CITY_CENTER.lat : preset!.lat,
      lng: isOther ? CITY_CENTER.lng : preset!.lng,
      requiredBy: new Date(requiredBy).toISOString(),
      urgency,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    toast.success(`Request ${request.id} created`, {
      description: "Notify compatible donors from the tracking page.",
    });
    navigate({ to: "/request/$id", params: { id: request.id } });
  }

  return (
    <div className="shell pb-20">
      <PageHeader
        eyebrow="Emergency"
        title="Create a blood request"
        description="Accurate details help BloodBridge rank the right donors first. Contact details stay private until a donor accepts."
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="gap-5 p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="units">Units required</Label>
              <Input
                id="units"
                type="number"
                min={1}
                max={10}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
              />
              {errors['units'] && <p className="text-xs text-destructive">{errors['units']}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Hospital</Label>
            <Select value={hospitalChoice} onValueChange={setHospitalChoice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOSPITALS.map((h) => (
                  <SelectItem key={h.name} value={h.name}>
                    {h.name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>Other hospital…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isOther && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="hospital">Hospital name</Label>
                <Input
                  id="hospital"
                  value={customHospital}
                  onChange={(e) => setCustomHospital(e.target.value)}
                  placeholder="e.g. Sunshine Hospitals"
                />
                {errors['hospital'] && (
                  <p className="text-xs text-destructive">{errors['hospital']}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area">Area / locality</Label>
                <Input
                  id="area"
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder="e.g. Gachibowli"
                />
                {errors['area'] && <p className="text-xs text-destructive">{errors['area']}</p>}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCIES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {URGENCY_META[u].dot} {URGENCY_META[u].label} — {URGENCY_META[u].hint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="requiredBy">Required by</Label>
              <Input
                id="requiredBy"
                type="datetime-local"
                value={requiredBy}
                onChange={(e) => setRequiredBy(e.target.value)}
              />
              {errors['requiredBy'] && (
                <p className="text-xs text-destructive">{errors['requiredBy']}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes for donors (optional)</Label>
            <Textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ward, attendant name, gate to use, or any context that helps a donor arrive fast."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting}>
              Create request
            </Button>
            <Button type="button" variant="outline" onClick={() => history.back()}>
              Cancel
            </Button>
          </div>
        </Card>

        <Card className="h-fit gap-3 p-6 shadow-soft">
          <h2 className="font-display text-2xl">What happens next</h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li>1. We gate donors by real ABO/Rh compatibility for {group}.</li>
            <li>2. Compatible donors are ranked by distance, eligibility and response speed.</li>
            <li>3. You notify them — nobody sees your number until a donor accepts.</li>
            <li>4. Track status live and mark the request fulfilled when done.</li>
          </ol>
        </Card>
      </form>
    </div>
  );
}
