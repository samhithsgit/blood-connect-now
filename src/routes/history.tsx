import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/bb/page";
import { RequireAuth } from "@/components/bb/require-auth";
import { BloodTag, Chip, StatusChip, UrgencyChip } from "@/components/bb/badges";
import type { BloodRequest } from "@/lib/demo-data";
import { useRequests, useUser } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Request History — BloodBridge" },
      {
        name: "description",
        content:
          "Review every BloodBridge request you raised or responded to, with status, urgency and fulfilment dates.",
      },
      { property: "og:title", content: "Request History — BloodBridge" },
      {
        property: "og:description",
        content: "Your full BloodBridge activity log: requests raised, donors notified, donations accepted.",
      },
    ],
  }),
  component: HistoryRoute,
});

function HistoryRoute() {
  return (
    <RequireAuth>
      <History />
    </RequireAuth>
  );
}

const ACTIVE: BloodRequest["status"][] = ["searching", "notified", "accepted"];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function RequestRow({ request, note }: { request: BloodRequest; note?: string }) {
  return (
    <Card className="gap-3 p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <BloodTag group={request.bloodGroup} />
          <div>
            <p className="font-semibold leading-tight">
              {request.units} unit{request.units === 1 ? "" : "s"} · {request.hospital}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {request.area}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip status={request.status} />
          <UrgencyChip urgency={request.urgency} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Raised {formatDate(request.createdAt)}
        </span>
        <span aria-hidden>·</span>
        <span>Needed by {formatDate(request.requiredBy)}</span>
        <span aria-hidden>·</span>
        <span className="font-mono">{request.id}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex flex-wrap gap-2">
          <Chip>{request.notifiedDonorIds.length} notified</Chip>
          <Chip tone={request.acceptedDonorIds.length ? "success" : "neutral"}>
            {request.acceptedDonorIds.length} accepted
          </Chip>
          {note && <Chip tone="info">{note}</Chip>}
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/request/$id" params={{ id: request.id }}>
            View details
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function Section({
  title,
  subtitle,
  requests,
  note,
  empty,
}: {
  title: string;
  subtitle: string;
  requests: BloodRequest[];
  note?: string;
  empty: { title: string; description: string };
}) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-4">
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {requests.length === 0 ? (
        <EmptyState
          title={empty.title}
          description={empty.description}
          action={
            <Button asChild variant="outline">
              <Link to="/find-donors">Explore the network</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {requests.map((r) => (
            <RequestRow key={r.id} request={r} {...(note ? { note } : {})} />
          ))}
        </div>
      )}
    </section>
  );
}

function History() {
  const user = useUser()!;
  const requests = useRequests();

  const { active, closed } = useMemo(() => {
    const mine =
      user.role === "seeker"
        ? requests.filter((r) => r.seekerId === user.id)
        : requests.filter((r) => user.donorId && r.acceptedDonorIds.includes(user.donorId));
    const sorted = [...mine].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return {
      active: sorted.filter((r) => ACTIVE.includes(r.status)),
      closed: sorted.filter((r) => !ACTIVE.includes(r.status)),
    };
  }, [requests, user]);

  const notified = useMemo(
    () =>
      user.role === "donor" && user.donorId
        ? requests.filter(
            (r) =>
              user.donorId &&
              r.notifiedDonorIds.includes(user.donorId) &&
              !r.acceptedDonorIds.includes(user.donorId),
          )
        : [],
    [requests, user],
  );

  const isSeeker = user.role === "seeker";

  return (
    <div className="shell pb-20">
      <PageHeader
        eyebrow="Activity log"
        title={isSeeker ? "Your request history" : "Your donation history"}
        description={
          isSeeker
            ? "Every emergency request you raised on BloodBridge, from first search to fulfilment."
            : "Requests you accepted, plus alerts you were notified about across the network."
        }
        actions={
          isSeeker ? (
            <Button asChild>
              <Link to="/request/new">New request</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          )
        }
      />

      <Section
        title={isSeeker ? "Active requests" : "Active commitments"}
        subtitle={
          isSeeker
            ? "Still searching, notified or with a donor en route."
            : "Requests you accepted that are not closed yet."
        }
        requests={active}
        empty={{
          title: isSeeker ? "No active requests" : "No active commitments",
          description: isSeeker
            ? "When you raise an emergency request it appears here until it is fulfilled or cancelled."
            : "Accept a compatible request from your dashboard and it will show up here.",
        }}
      />

      <Section
        title={isSeeker ? "Closed requests" : "Completed donations"}
        subtitle="Fulfilled and cancelled records kept for your reference."
        requests={closed}
        empty={{
          title: "Nothing closed yet",
          description: "Fulfilled and cancelled requests are archived here automatically.",
        }}
      />

      {!isSeeker && (
        <Section
          title="Alerts you were notified about"
          subtitle="Compatible requests that reached you but which you have not accepted."
          requests={notified}
          note="Notified"
          empty={{
            title: "No pending alerts",
            description: "Keep your availability on to receive compatible emergency alerts.",
          }}
        />
      )}
    </div>
  );
}
