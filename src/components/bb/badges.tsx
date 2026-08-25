import { BadgeCheck, CircleSlash, Clock, Droplet, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EligibilityStatus, Urgency } from "@/lib/blood";
import { URGENCY_META } from "@/lib/blood";
import type { RequestStatus } from "@/lib/demo-data";

export function BloodTag({ group, className }: { group: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md bg-accent px-2 text-sm font-extrabold tracking-tight text-accent-foreground",
        className,
      )}
    >
      <Droplet className="h-3.5 w-3.5" aria-hidden />
      {group}
    </span>
  );
}

export function Chip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/18 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
    info: "bg-info/12 text-info",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EligibilityChip({ status, label }: { status: EligibilityStatus; label: string }) {
  if (status === "eligible") return <Chip tone="success">{label}</Chip>;
  if (status === "recently-donated")
    return (
      <Chip tone="warning">
        <Clock className="h-3 w-3" aria-hidden />
        {label}
      </Chip>
    );
  return (
    <Chip tone="neutral">
      <CircleSlash className="h-3 w-3" aria-hidden />
      {label}
    </Chip>
  );
}

export function AvailabilityChip({ available }: { available: boolean }) {
  return (
    <Chip tone={available ? "success" : "neutral"}>
      <span
        className={cn("h-2 w-2 rounded-full", available ? "bg-success" : "bg-muted-foreground/60")}
        aria-hidden
      />
      {available ? "Available" : "Unavailable"}
    </Chip>
  );
}

export function VerifiedChip({ verified }: { verified: boolean }) {
  return verified ? (
    <Chip tone="info">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      Verified
    </Chip>
  ) : (
    <Chip tone="neutral">
      <ShieldQuestion className="h-3.5 w-3.5" aria-hidden />
      Unverified
    </Chip>
  );
}

export function UrgencyChip({ urgency }: { urgency: Urgency }) {
  const meta = URGENCY_META[urgency];
  const tone = urgency === "critical" ? "danger" : urgency === "urgent" ? "warning" : "neutral";
  return (
    <Chip tone={tone}>
      <span aria-hidden>{meta.dot}</span>
      {meta.label}
    </Chip>
  );
}

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  searching: "Searching",
  notified: "Donors Notified",
  accepted: "Donor Accepted",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

export function StatusChip({ status }: { status: RequestStatus }) {
  const tone =
    status === "fulfilled"
      ? "success"
      : status === "accepted"
        ? "info"
        : status === "cancelled"
          ? "neutral"
          : "warning";
  return <Chip tone={tone}>{REQUEST_STATUS_LABEL[status]}</Chip>;
}
