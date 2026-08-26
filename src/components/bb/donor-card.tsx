import { Phone, MapPin, Timer, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AvailabilityChip, BloodTag, Chip, EligibilityChip, VerifiedChip } from "./badges";
import type { DonorMatch } from "@/lib/matching";
import { cn } from "@/lib/utils";

export function DonorCard({
  match,
  revealContact,
  onInvite,
  invited,
  className,
}: {
  match: DonorMatch;
  revealContact?: boolean;
  onInvite?: () => void;
  invited?: boolean;
  className?: string;
}) {
  const { donor, distanceLabel, eligibility, isBestMatch, score } = match;
  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden p-5 shadow-soft transition-shadow hover:shadow-lift",
        isBestMatch && "ring-2 ring-primary/50",
        className,
      )}
    >
      {isBestMatch && (
        <span className="absolute right-0 top-0 rounded-bl-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          Best match
        </span>
      )}
      <div className="flex items-start gap-3">
        <BloodTag group={donor.bloodGroup} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold">{donor.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {donor.area} · {distanceLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <EligibilityChip status={eligibility.status} label={eligibility.label} />
        <AvailabilityChip available={donor.available} />
        <VerifiedChip verified={donor.verified} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2 text-center">
        <Stat icon={<Heart className="h-3.5 w-3.5" />} label="Donations" value={String(donor.donations)} />
        <Stat icon={<Timer className="h-3.5 w-3.5" />} label="Responds" value={`~${donor.avgResponseMinutes}m`} />
        <Stat label="Match score" value={String(score)} />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{eligibility.detail}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {revealContact ? (
          <Button asChild size="sm">
            <a href={`tel:${donor.phone.replace(/\s/g, "")}`}>
              <Phone className="h-4 w-4" aria-hidden /> {donor.phone}
            </a>
          </Button>
        ) : (
          <Chip tone="neutral">Contact shared after the donor accepts</Chip>
        )}
        {onInvite && (
          <Button size="sm" variant={invited ? "outline" : "default"} disabled={invited} onClick={onInvite}>
            {invited ? "Notified" : "Notify donor"}
          </Button>
        )}
      </div>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 text-sm font-bold">
        {icon}
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
