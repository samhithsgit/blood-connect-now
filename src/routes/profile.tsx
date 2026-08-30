import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Activity, Mail, MapPin, Phone, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/bb/page";
import { RequireAuth } from "@/components/bb/require-auth";
import {
  AvailabilityChip,
  BloodTag,
  Chip,
  EligibilityChip,
  VerifiedChip,
} from "@/components/bb/badges";
import { canDonateTo, evaluateEligibility } from "@/lib/blood";
import { CITY_NAME } from "@/lib/demo-data";
import { setDonorAvailability, useDonors, useRequests, useUser } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — BloodBridge" },
      {
        name: "description",
        content:
          "Manage your BloodBridge profile: blood group, location, verification, eligibility and donor availability.",
      },
      { property: "og:title", content: "Your Profile — BloodBridge" },
      {
        property: "og:description",
        content: "Your donor or seeker account details and availability controls.",
      },
    ],
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="font-display text-3xl leading-none">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Profile() {
  const user = useUser()!;
  const donors = useDonors();
  const requests = useRequests();
  const donor = user.donorId ? donors.find((d) => d.id === user.donorId) : undefined;

  const eligibility = donor
    ? evaluateEligibility({ lastDonationDate: donor.lastDonationDate, available: donor.available })
    : null;

  const seekerRequests = requests.filter((r) => r.seekerId === user.id);
  const donorAccepted = donor
    ? requests.filter((r) => r.acceptedDonorIds.includes(donor.id))
    : [];

  return (
    <div className="shell pb-20">
      <PageHeader
        eyebrow="Account"
        title={user.name}
        description={
          donor
            ? "Your donor profile controls who can reach you and which emergency alerts you receive."
            : "Your seeker account details used on every emergency request you raise."
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/history">View history</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="gap-2 p-6 shadow-soft">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {donor && <BloodTag group={donor.bloodGroup} />}
              <Chip tone="info" className="capitalize">
                {user.role}
              </Chip>
              {donor && <VerifiedChip verified={donor.verified} />}
              {donor && <AvailabilityChip available={donor.available} />}
              {eligibility && (
                <EligibilityChip status={eligibility.status} label={eligibility.label} />
              )}
            </div>

            <Row icon={<Mail className="h-4 w-4" aria-hidden />} label="Email" value={user.email} />
            <Row icon={<Phone className="h-4 w-4" aria-hidden />} label="Phone" value={user.phone} />
            <Row
              icon={<MapPin className="h-4 w-4" aria-hidden />}
              label="Location"
              value={donor ? `${donor.area}, ${donor.city}` : CITY_NAME}
            />
            {donor && (
              <>
                <Row
                  icon={<Activity className="h-4 w-4" aria-hidden />}
                  label="Eligibility"
                  value={eligibility?.detail ?? "—"}
                />
                <Row
                  icon={<Timer className="h-4 w-4" aria-hidden />}
                  label="Average response"
                  value={`${donor.avgResponseMinutes} min`}
                />
              </>
            )}
          </Card>

          {donor ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Lifetime donations" value={donor.donations} />
              <Stat label="Requests accepted" value={donorAccepted.length} />
              <Stat label="Lives supported" value={donor.donations * 3} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Requests raised" value={seekerRequests.length} />
              <Stat
                label="Fulfilled"
                value={seekerRequests.filter((r) => r.status === "fulfilled").length}
              />
              <Stat
                label="Active"
                value={
                  seekerRequests.filter((r) => !["fulfilled", "cancelled"].includes(r.status)).length
                }
              />
            </div>
          )}

          {donor && (
            <Card className="gap-3 p-6 shadow-soft">
              <h2 className="font-display text-2xl">Who you can help</h2>
              <p className="text-sm text-muted-foreground">
                As a {donor.bloodGroup} donor your red cells are compatible with these recipient
                groups.
              </p>
              <div className="flex flex-wrap gap-2">
                {canDonateTo(donor.bloodGroup).map((g) => (
                  <Chip key={g} tone="success">
                    {g}
                  </Chip>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {donor ? (
            <Card className="gap-4 p-6 shadow-soft lg:sticky lg:top-20">
              <div>
                <h2 className="font-display text-2xl">Availability</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Turn this off to stop receiving emergency alerts. You stay listed but marked
                  unavailable.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
                <Label htmlFor="availability" className="text-sm font-semibold">
                  Available to donate
                </Label>
                <Switch
                  id="availability"
                  checked={donor.available}
                  onCheckedChange={(v) => {
                    setDonorAvailability(donor.id, v);
                    toast.success(v ? "You are now available" : "Availability paused");
                  }}
                />
              </div>
              {eligibility && eligibility.status === "recently-donated" && (
                <p className="text-xs text-warning-foreground">{eligibility.detail}</p>
              )}
              <Button asChild variant="outline">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            </Card>
          ) : (
            <Card className="gap-4 p-6 shadow-soft lg:sticky lg:top-20">
              <div>
                <h2 className="font-display text-2xl">Need blood?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Raise an emergency request and BloodBridge will rank compatible donors near your
                  hospital instantly.
                </p>
              </div>
              <Button asChild>
                <Link to="/request/new">Create request</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/find-donors">Find donors</Link>
              </Button>
            </Card>
          )}

          <Card className="gap-2 p-6 shadow-soft">
            <h3 className="font-semibold">Privacy</h3>
            <p className="text-sm text-muted-foreground">
              Your phone number is only revealed to a seeker after you accept their request. This
              prototype stores data locally in your browser.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
