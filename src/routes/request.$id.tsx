import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BellRing, CheckCircle2, ChevronDown, Clock, Info, MapPin, Send, Sparkles } from "lucide-react";
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
  createEmergencyAlerts,
  inviteDonor,
  setRequestStatus,
  summarizeAlerts,
  useAlerts,
  useDonors,
  useInvites,
  useRequests,
  useUser,
} from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const alerts = useAlerts();


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

  /** Alert candidates come straight from the Smart Match Engine ranking. */
  const alertCandidates = matches.filter(
    (m) => m.donor.available && m.eligibility.status === "eligible",
  );
  const requestAlerts = alerts.filter((a) => a.requestId === request.id);
  const summary = summarizeAlerts(alerts, request.id);
  const alreadyAlerted = new Set(requestAlerts.map((a) => a.donorId));
  const newCandidates = alertCandidates.filter((m) => !alreadyAlerted.has(m.donor.id));

  function handleConfirmAlerts() {
    try {
      const created = createEmergencyAlerts(
        request!.id,
        newCandidates.map((m) => ({
          donorId: m.donor.id,
          score: Math.round(m.score),
          distanceKm: m.distanceKm,
          distanceLabel: m.distanceLabel,
          why: m.why,
          primaryReason: m.primaryReason,
        })),
      );
      setConfirmOpen(false);
      if (created === 0) {
        toast.info("All matched donors have already been alerted");
        return;
      }
      toast.success(`${created} compatible donor${created === 1 ? "" : "s"} alerted`, {
        description: "Demo alerts appear on donor dashboards — no SMS or push is sent.",
      });
    } catch {
      toast.error("Could not create emergency alerts. Please try again.");
    }
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
                <Button onClick={() => setConfirmOpen(true)}>
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

          <Card className="gap-4 p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-2xl">
                <BellRing className="h-5 w-5 text-primary" aria-hidden />
                Emergency alert responses
              </h2>
              <Chip tone="neutral">Demo alerts · in-app only</Chip>
            </div>
            {summary.alerted === 0 ? (
              <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                No donors alerted yet.{" "}
                {isOwner && !closed
                  ? "Use “Notify compatible donors” to alert the highest-ranked matches."
                  : "The requester has not sent emergency alerts for this request."}
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold">
                  {summary.alerted} Alerted · {summary.accepted} Accepted · {summary.pending} Pending ·{" "}
                  {summary.declined} Declined
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <EngineStat label="Alerted" value={String(summary.alerted)} />
                  <EngineStat label="Accepted" value={String(summary.accepted)} />
                  <EngineStat label="Pending" value={String(summary.pending)} />
                  <EngineStat label="Declined" value={String(summary.declined)} />
                </div>
                <ul className="space-y-2">
                  {requestAlerts.map((a) => {
                    const donor = donors.find((d) => d.id === a.donorId);
                    if (!donor) return null;
                    return (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                      >
                        <BloodTag group={donor.bloodGroup} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{donor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.distanceLabel} · Match {a.score}/100
                          </p>
                        </div>
                        {a.response === "accepted" && <Chip tone="success">Donor confirmed</Chip>}
                        {a.response === "declined" && <Chip tone="danger">Declined</Chip>}
                        {a.response === "pending" && <Chip tone="warning">Awaiting response</Chip>}
                      </li>
                    );
                  })}
                </ul>
              </>
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Alert compatible donors</DialogTitle>
            <DialogDescription>
              BloodBridge will alert the highest-ranked compatible donors from the Smart Match
              Engine. These are in-app demo alerts — no SMS, push or email is sent.
            </DialogDescription>
          </DialogHeader>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Request ID" value={request.id} />
            <Detail label="Blood group" value={request.bloodGroup} />
            <Detail label="Units required" value={String(request.units)} />
            <Detail label="Urgency" value={request.urgency} />
            <Detail label="Location" value={`${request.hospital}, ${request.area}`} />
            <Detail label="Search radius" value={`${radius} km`} />
          </dl>

          <div className="grid grid-cols-2 gap-3">
            <EngineStat label="Compatible donors" value={String(matches.length)} />
            <EngineStat label="Eligible & available" value={String(alertCandidates.length)} />
          </div>

          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            {newCandidates.length > 0
              ? `${newCandidates.length} donor${newCandidates.length === 1 ? "" : "s"} will be alerted now.`
              : alertCandidates.length > 0
                ? "Every eligible, available match has already been alerted for this request."
                : "No eligible, available compatible donors in this radius — widen the radius and try again."}
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAlerts} disabled={newCandidates.length === 0}>
              <BellRing className="h-4 w-4" aria-hidden /> Confirm &amp; alert donors
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}

function SmartMatchEngine({ matches, radiusKm }: { matches: DonorMatch[]; radiusKm: number }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const ready = matches.filter((m) => m.donor.available && m.eligibility.status === "eligible");
  const best = matches.find((m) => m.isBestMatch);
  const runnersUp = matches.filter((m) => m !== best).slice(0, 4);

  return (
    <Card className="gap-5 border-primary/30 p-6 shadow-soft ring-1 ring-primary/15">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          Smart Match Engine
        </h2>
        <Chip tone="neutral">Deterministic · rule-based</Chip>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <EngineStat label="Compatible donors" value={String(matches.length)} />
        <EngineStat label="Eligible & available" value={String(ready.length)} />
        <EngineStat label="Search radius" value={`${radiusKm} km`} />
      </div>

      {best ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <BloodTag group={best.donor.bloodGroup} />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  Best match
                </p>
                <p className="text-lg font-bold">{best.donor.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {best.donor.area} · {best.distanceLabel}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl text-primary">{Math.round(best.score)}%</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Match</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <EligibilityChip status={best.eligibility.status} label={best.eligibility.label} />
            <AvailabilityChip available={best.donor.available} />
          </div>

          <button
            type="button"
            onClick={() => setWhyOpen((v) => !v)}
            className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary"
            aria-expanded={whyOpen}
          >
            Why this donor?
            <ChevronDown
              className={whyOpen ? "h-4 w-4 rotate-180 transition-transform" : "h-4 w-4 transition-transform"}
              aria-hidden
            />
          </button>
          {whyOpen && (
            <ul className="mt-2 space-y-1.5 rounded-lg bg-background/70 p-3 text-sm">
              {best.why.map((w) => (
                <li key={w} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
          No compatible donors in this radius yet — widen the radius below to re-rank.
        </p>
      )}

      {runnersUp.length > 0 && (
        <ol className="space-y-2">
          {runnersUp.map((m, i) => (
            <li
              key={m.donor.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                {i + 2}
              </span>
              <BloodTag group={m.donor.bloodGroup} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{m.donor.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.distanceLabel} · {m.primaryReason}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <EligibilityChip status={m.eligibility.status} label={m.eligibility.label} />
                <AvailabilityChip available={m.donor.available} />
                <Chip tone="neutral">{Math.round(m.score)}%</Chip>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-lg bg-muted/60 p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Info className="h-4 w-4 text-primary" aria-hidden />
          How matching works
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          BloodBridge ranks donors with a transparent, deterministic score — no black-box AI.
          Blood compatibility ({MATCH_WEIGHTS.compatibility}%) is a strict rule-based gate,
          then we add proximity ({MATCH_WEIGHTS.proximity}%), current availability (
          {MATCH_WEIGHTS.availability}%) and donation eligibility ({MATCH_WEIGHTS.eligibility}%).
          Scores are indicative only and are not medically validated or clinically predictive.
        </p>
      </div>
    </Card>
  );
}

function EngineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3 text-center">
      <p className="font-display text-2xl">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
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
