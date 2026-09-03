import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Activity, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, EmptyState } from "@/components/bb/page";
import { RequireAuth } from "@/components/bb/require-auth";
import {
  BloodTag,
  Chip,
  EligibilityChip,
  StatusChip,
  UrgencyChip,
} from "@/components/bb/badges";
import { canDonate, evaluateEligibility, formatDistance, haversineKm } from "@/lib/blood";
import type { BloodRequest } from "@/lib/demo-data";
import {
  acceptRequest,
  setDonorAvailability,
  useDonors,
  useRequests,
  useUser,
} from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your BloodBridge Dashboard" },
      {
        name: "description",
        content:
          "Manage donor availability, respond to compatible blood requests, and track your active emergency requests.",
      },
      { property: "og:title", content: "Your BloodBridge Dashboard" },
      {
        property: "og:description",
        content: "Donor availability, compatible requests and live request tracking in one place.",
      },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <RequireAuth>
      <DashboardBody />
    </RequireAuth>
  );
}

function DashboardBody() {
  const user = useUser()!;
  return user.role === "donor" ? <DonorDashboard /> : <SeekerDashboard />;
}

/* --------------------------------- donor --------------------------------- */

function DonorDashboard() {
  const user = useUser()!;
  const donors = useDonors();
  const requests = useRequests();
  const donor = donors.find((d) => d.id === user.donorId) ?? donors[0]!;

  const eligibility = evaluateEligibility({
    lastDonationDate: donor.lastDonationDate,
    available: donor.available,
  });

  const compatible = requests
    .filter((r) => r.status !== "cancelled" && r.status !== "fulfilled")
    .filter((r) => canDonate(donor.bloodGroup, r.bloodGroup))
    .map((r) => ({
      request: r,
      distanceKm: Math.round(haversineKm({ lat: donor.lat, lng: donor.lng }, { lat: r.lat, lng: r.lng }) * 10) / 10,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const accepted = requests.filter((r) => r.acceptedDonorIds.includes(donor.id));

  function handleAccept(request: BloodRequest) {
    acceptRequest(request.id, donor.id);
    toast.success(`You accepted request ${request.id}`, {
      description: "The seeker can now see your contact details.",
    });
  }

  return (
    <div className="shell pb-20">
      <PageHeader
        eyebrow="Donor workspace"
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Keep your availability accurate — matching only surfaces donors who can actually help right now."
        actions={
          <Button asChild variant="outline">
            <Link to="/profile">Edit profile</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="gap-3 p-5 shadow-soft sm:col-span-2">
          <div className="flex items-start gap-3">
            <BloodTag group={donor.bloodGroup} />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold">{donor.name}</h2>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {donor.area}, {donor.city}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <EligibilityChip status={eligibility.status} label={eligibility.label} />
            <Chip tone="neutral">{eligibility.detail}</Chip>
          </div>
          <div className="mt-1 flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
            <div>
              <Label className="text-sm font-semibold">Available to donate</Label>
              <p className="text-xs text-muted-foreground">
                Turning this off hides you from emergency matching.
              </p>
            </div>
            <Switch
              checked={donor.available}
              onCheckedChange={(v) => {
                setDonorAvailability(donor.id, v);
                toast.success(v ? "You're now available" : "Availability paused");
              }}
            />
          </div>
        </Card>

        <Card className="gap-3 p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Impact</p>
          <p className="font-display text-5xl leading-none">{donor.donations}</p>
          <p className="text-sm text-muted-foreground">lifetime donations recorded</p>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" aria-hidden />
            Avg response ~{donor.avgResponseMinutes} min
          </p>
        </Card>
      </div>

      <DonorEmergencyAlerts donorId={donor.id} />

      <h2 className="mt-10 font-display text-2xl">Compatible requests near you</h2>

      <p className="mb-4 text-sm text-muted-foreground">
        Only requests your blood group can safely serve are shown.
      </p>

      {compatible.length === 0 ? (
        <EmptyState
          title="No compatible requests right now"
          description="You'll see live emergency requests here as soon as one matches your blood group."
          action={
            <Button asChild variant="outline">
              <Link to="/map">View donor map</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {compatible.map(({ request, distanceKm }) => {
            const hasAccepted = request.acceptedDonorIds.includes(donor.id);
            return (
              <Card key={request.id} className="gap-3 p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <BloodTag group={request.bloodGroup} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold">{request.seekerName}</h3>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {request.hospital}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {request.area} · {formatDistance(distanceKm)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <UrgencyChip urgency={request.urgency} />
                  <StatusChip status={request.status} />
                  <Chip tone="neutral">{request.units} unit{request.units === 1 ? "" : "s"}</Chip>
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={hasAccepted}
                    onClick={() => handleAccept(request)}
                  >
                    {hasAccepted ? "Accepted" : "Accept request"}
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/request/$id" params={{ id: request.id }}>
                      View details
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {accepted.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-2xl">Requests you accepted</h2>
          <div className="mt-4 grid gap-3">
            {accepted.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ----------------------------- emergency alerts --------------------------- */

function DonorEmergencyAlerts({ donorId }: { donorId: string }) {
  const alerts = useAlerts();
  const requests = useRequests();
  const mine = alerts.filter((a) => a.donorId === donorId);

  function respond(alertId: string, response: "accepted" | "declined") {
    const ok = respondToAlert(alertId, response);
    if (!ok) {
      toast.error("This alert can no longer be answered.");
      return;
    }
    if (response === "accepted") {
      toast.success("You accepted this emergency request", {
        description: "The requester can now see your contact details.",
      });
    } else {
      toast.info("You declined this emergency request.");
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <BellRing className="h-5 w-5 text-primary" aria-hidden />
          Emergency alerts
        </h2>
        <Chip tone="neutral">Demo alerts · in-app only</Chip>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          title="No emergency alerts"
          description="When a hospital or seeker alerts the top-ranked matches for a request you fit, it appears here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mine.map((alert) => {
            const request = requests.find((r) => r.id === alert.requestId);
            if (!request) {
              return (
                <Card key={alert.id} className="gap-2 p-5 shadow-soft">
                  <p className="text-sm font-semibold">Request {alert.requestId}</p>
                  <p className="text-sm text-muted-foreground">
                    This request is no longer available.
                  </p>
                </Card>
              );
            }
            const closed = request.status === "fulfilled" || request.status === "cancelled";
            return (
              <Card key={alert.id} className="gap-3 p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <BloodTag group={request.bloodGroup} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">
                        Emergency · {request.id}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {request.bloodGroup} needed · {request.units} unit
                        {request.units === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl text-primary">{alert.score}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      /100 match
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <UrgencyChip urgency={request.urgency} />
                  <StatusChip status={request.status} />
                  <Chip tone="neutral">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {request.hospital} · {alert.distanceLabel}
                  </Chip>
                </div>

                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Why you&apos;re matched
                  </p>
                  <ul className="mt-1.5 space-y-1 text-sm">
                    {alert.why.map((w) => (
                      <li key={w} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span className="min-w-0 break-words">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {alert.response === "accepted" && <Chip tone="success">You accepted this alert</Chip>}
                {alert.response === "declined" && (
                  <Chip tone="danger">You declined this emergency request.</Chip>
                )}
                {alert.response === "pending" && closed && (
                  <Chip tone="neutral">This request is already closed.</Chip>
                )}

                <div className="mt-1 flex flex-wrap gap-2">
                  {alert.response === "pending" && !closed && (
                    <>
                      <Button size="sm" onClick={() => respond(alert.id, "accepted")}>
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respond(alert.id, "declined")}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link to="/request/$id" params={{ id: request.id }}>
                      View details
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* --------------------------------- seeker -------------------------------- */


function SeekerDashboard() {
  const user = useUser()!;
  const requests = useRequests();
  const mine = requests.filter((r) => r.seekerId === user.id || r.seekerName === user.name);
  const active = mine.filter((r) => r.status !== "fulfilled" && r.status !== "cancelled");
  const closed = mine.filter((r) => r.status === "fulfilled" || r.status === "cancelled");

  return (
    <div className="shell pb-20">
      <PageHeader
        eyebrow="Seeker workspace"
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Track your emergency requests, notify compatible donors and follow every status change."
        actions={
          <>
            <Button asChild>
              <Link to="/request/new">
                <Plus className="h-4 w-4" aria-hidden /> New request
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/find-donors">Find donors</Link>
            </Button>
          </>
        }
      />

      <h2 className="font-display text-2xl">Active requests</h2>
      <div className="mt-4">
        {active.length === 0 ? (
          <EmptyState
            title="No active requests"
            description="Create an emergency request and BloodBridge will rank compatible donors within seconds."
            action={
              <Button asChild>
                <Link to="/request/new">Create request</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {active.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </div>
        )}
      </div>

      {closed.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-2xl">Closed requests</h2>
          <div className="mt-4 grid gap-3">
            {closed.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function RequestRow({ request }: { request: BloodRequest }) {
  return (
    <Card className="gap-3 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <BloodTag group={request.bloodGroup} />
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">
            {request.id} · {request.units} unit{request.units === 1 ? "" : "s"}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{request.hospital}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Raised {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <UrgencyChip urgency={request.urgency} />
        <StatusChip status={request.status} />
        <Button asChild size="sm" variant="outline">
          <Link to="/request/$id" params={{ id: request.id }}>
            Track
          </Link>
        </Button>
      </div>
    </Card>
  );
}
