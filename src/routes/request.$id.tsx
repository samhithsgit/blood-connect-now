import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, Clock, Info, MapPin, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/bb/page";
import { RequireAuth } from "@/components/bb/require-auth";
import { DonorCard } from "@/components/bb/donor-card";
import {
  AvailabilityChip,
  BloodTag,
  Chip,
  EligibilityChip,
  StatusChip,
  UrgencyChip,
  REQUEST_STATUS_LABEL,
} from "@/components/bb/badges";
import { RADIUS_OPTIONS } from "@/lib/blood";
import type { RequestStatus } from "@/lib/demo-data";
import { matchDonors, MATCH_WEIGHTS, type DonorMatch } from "@/lib/matching";
import {
  acceptRequest,
  inviteDonor,
  notifyDonors,
  setRequestStatus,
  useDonors,
  useInvites,
  useRequests,
  useUser,
} from "@/lib/store";

export const Route = createFileRoute("/request/$id")({
  head: () => ({
    meta: [
      { title: "Track Blood Request — BloodBridge" },
      {
        name: "description",
        content:
          "Live tracking for a BloodBridge request: notified donors, acceptances, contact reveal and fulfilment.",
      },
      { property: "og:title", content: "Track Blood Request — BloodBridge" },
      {
        property: "og:description",
        content: "Follow donor notifications, acceptances and fulfilment in real time.",
      },
    ],
  }),
  component: RequestDetailRoute,
});

const TIMELINE: RequestStatus[] = ["searching", "notified", "accepted", "fulfilled"];

function RequestDetailRoute() {
  return (
    <RequireAuth>
      <RequestDetail />
    </RequireAuth>
  );
}

function RequestDetail() {
  const { id } = Route.useParams();
  const user = useUser()!;
  const requests = useRequests();
  const donors = useDonors();
  const invites = useInvites();
  const [radius, setRadius] = useState<number>(10);

  const request = requests.find((r) => r.id.toLowerCase() === id.toLowerCase());

  const matches = useMemo(
    () =>
      request
        ? matchDonors(donors, {
            recipientGroup: request.bloodGroup,
            origin: { lat: request.lat, lng: request.lng },
            radiusKm: radius,
            urgency: request.urgency,
            sort: "best",
          })
        : [],
    [donors, request, radius],
  );

  if (!request) {
    return (
      <div className="shell pb-20">
        <PageHeader eyebrow="Request" title="Request not found" />
        <EmptyState
          title={`No request matches “${id}”`}
          description="The request may have been removed, or the link is incorrect."
          action={
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isOwner = user.role === "seeker" && (request.seekerId === user.id || request.seekerName === user.name);
  const myDonorId = user.donorId;
  const iAccepted = !!myDonorId && request.acceptedDonorIds.includes(myDonorId);
  const closed = request.status === "fulfilled" || request.status === "cancelled";
  const acceptedDonors = donors.filter((d) => request.acceptedDonorIds.includes(d.id));
  const invited = invites[request.id] ?? [];
  const stageIndex = TIMELINE.indexOf(request.status);

  function handleNotifyAll() {
    const ids = matches.filter((m) => m.donor.available).map((m) => m.donor.id);
    if (ids.length === 0) {
      toast.error("No compatible, available donors in this radius");
      return;
    }
    notifyDonors(request!.id, ids);
    toast.success(`Notified ${ids.length} compatible donor${ids.length === 1 ? "" : "s"}`);
  }

  return (
    <div className="shell pb-20">
      <PageHeader
        eyebrow={`Request ${request.id}`}
        title={`${request.bloodGroup} · ${request.units} unit${request.units === 1 ? "" : "s"}`}
        description={`${request.hospital}, ${request.area}`}
        actions={
          <>
            {isOwner && !closed && (
              <>
                <Button onClick={handleNotifyAll}>
                  <Send className="h-4 w-4" aria-hidden /> Notify compatible donors
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRequestStatus(request.id, "fulfilled");
                    toast.success("Request marked fulfilled");
                  }}
                >
                  Mark fulfilled
                </Button>
              </>
            )}
            {user.role === "donor" && !closed && (
              <Button
                disabled={iAccepted || !myDonorId}
                onClick={() => {
                  acceptRequest(request.id, myDonorId!);
                  toast.success("You accepted this request");
                }}
              >
                {iAccepted ? "Accepted" : "Accept request"}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="gap-4 p-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <BloodTag group={request.bloodGroup} />
              <UrgencyChip urgency={request.urgency} />
              <StatusChip status={request.status} />
              <Chip tone="neutral">
                <MapPin className="h-3 w-3" aria-hidden />
                {request.area}
              </Chip>
              <Chip tone="neutral">
                <Clock className="h-3 w-3" aria-hidden />
                Needed by {new Date(request.requiredBy).toLocaleString()}
              </Chip>
            </div>

            <dl className="grid gap-4 sm:grid-cols-3">
              <Detail label="Raised by" value={request.seekerName} />
              <Detail
                label="Created"
                value={new Date(request.createdAt).toLocaleString()}
              />
              <Detail label="Units" value={String(request.units)} />
            </dl>

            {request.notes && (
              <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                {request.notes}
              </p>
            )}
          </Card>

          <Card className="gap-4 p-6 shadow-soft">
            <h2 className="font-display text-2xl">Progress</h2>
            <ol className="space-y-3">
              {TIMELINE.map((s, i) => {
                const done = request.status === "cancelled" ? false : i <= stageIndex;
                return (
                  <li key={s} className="flex items-start gap-3">
                    <span
                      className={
                        done
                          ? "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          : "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground"
                      }
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{REQUEST_STATUS_LABEL[s]}</p>
                      <p className="text-xs text-muted-foreground">
                        {s === "searching" && "Compatible donors are being ranked."}
                        {s === "notified" && `${request.notifiedDonorIds.length} donor(s) notified.`}
                        {s === "accepted" && `${request.acceptedDonorIds.length} donor(s) accepted.`}
                        {s === "fulfilled" && "Transfusion arranged — request closed."}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            {request.status === "cancelled" && (
              <Chip tone="neutral">This request was cancelled.</Chip>
            )}
          </Card>

          <SmartMatchEngine matches={matches} radiusKm={radius} />

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl">Compatible donors</h2>
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

            {matches.length === 0 ? (
              <EmptyState
                title="No compatible donors in range"
                description="Widen the radius — blood-group compatibility is never relaxed."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {matches.map((m) => {
                  const accepted = request.acceptedDonorIds.includes(m.donor.id);
                  const reveal = isOwner && accepted;
                  return (
                    <DonorCard
                      key={m.donor.id}
                      match={m}
                      revealContact={reveal}
                      invited={invited.includes(m.donor.id) || request.notifiedDonorIds.includes(m.donor.id)}
                      {...(isOwner && !closed
                        ? {
                            onInvite: () => {
                              inviteDonor(request.id, m.donor.id);
                              toast.success(`Notified ${m.donor.name}`);
                            },
                          }
                        : {})}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Card className="h-fit gap-3 p-6 shadow-soft">
          <h2 className="font-display text-2xl">Accepted donors</h2>
          {acceptedDonors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No donor has accepted yet. Contact details stay hidden until someone accepts.
            </p>
          ) : (
            <ul className="space-y-3">
              {acceptedDonors.map((d) => (
                <li key={d.id} className="rounded-lg border border-border p-3">
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.bloodGroup} · {d.area}
                  </p>
                  {isOwner || (myDonorId && myDonorId === d.id) ? (
                    <a
                      className="mt-1 inline-block text-sm font-semibold text-primary"
                      href={`tel:${d.phone.replace(/\s/g, "")}`}
                    >
                      {d.phone}
                    </a>
                  ) : (
                    <Chip tone="neutral" className="mt-1">
                      Contact visible to the requester only
                    </Chip>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!isOwner && user.role === "seeker" && (
            <Chip tone="neutral">You can only manage requests you created.</Chip>
          )}
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}
