import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, HeartPulse, MapPin, ShieldCheck, Siren, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BloodTag } from "@/components/bb/badges";
import { BLOOD_GROUPS } from "@/lib/blood";
import { DEMO_DONORS } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BloodBridge — Find Nearby Blood Donors Fast" },
      {
        name: "description",
        content:
          "Emergency blood donor matching by compatibility, distance, eligibility and availability. Right Blood. Right Donor. Right Distance. Right Time.",
      },
      { property: "og:title", content: "BloodBridge — Find Nearby Blood Donors Fast" },
      {
        property: "og:description",
        content: "Match emergency blood requests with nearby eligible donors in seconds.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: HeartPulse,
    title: "True ABO/Rh matching",
    body: "Every match respects real red-cell compatibility rules — never a group that cannot be transfused.",
  },
  {
    icon: MapPin,
    title: "Distance-aware search",
    body: "Haversine distance ranking with 5/10/25/50 km radius controls so the closest help surfaces first.",
  },
  {
    icon: Timer,
    title: "Eligibility windows",
    body: "A 90-day cooldown is applied automatically, with a countdown for donors who recently gave.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by default",
    body: "Phone numbers stay hidden until a donor explicitly accepts a request.",
  },
];

function Index() {
  const available = DEMO_DONORS.filter((d) => d.available).length;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="shell grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Siren className="h-3.5 w-3.5" aria-hidden /> Emergency ready
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Right Blood. Right Donor.
              <br />
              Right Distance. Right Time.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              BloodBridge replaces frantic WhatsApp broadcasts with an intelligent match: compatible
              blood group, nearby, eligible, and available — ranked in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/request/new">
                  <Siren className="h-4 w-4" aria-hidden /> Request blood now
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register">Become a donor</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/find-donors">Search donors</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              <Metric label="Donors on network" value={String(DEMO_DONORS.length)} />
              <Metric label="Available now" value={String(available)} />
              <Metric label="Median response" value="12 min" />
            </dl>
          </div>

          <Card className="self-center p-6 shadow-lift">
            <p className="text-sm font-semibold text-muted-foreground">Compatibility at a glance</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((g) => (
                <BloodTag key={g} group={g} className="w-full" />
              ))}
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <Row icon={<Activity className="h-4 w-4 text-primary" />} text="O− is the universal red-cell donor" />
              <Row icon={<Activity className="h-4 w-4 text-primary" />} text="AB+ can receive from every group" />
              <Row icon={<Activity className="h-4 w-4 text-primary" />} text="Rh− patients need Rh− blood" />
            </div>
            <p className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Prototype for demonstration. BloodBridge is not a medical service and does not replace
              licensed blood banks.
            </p>
          </Card>
        </div>
      </section>

      <section className="shell py-16">
        <h2 className="font-display text-4xl">Why matching beats broadcasting</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="gap-2 p-5 shadow-soft">
              <f.icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-2 font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="shell pb-20">
        <Card className="flex flex-col items-start gap-4 bg-ink p-8 text-ink-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-3xl">Someone nearby can help right now.</h2>
            <p className="mt-1 text-sm opacity-80">
              Post a request and notify compatible donors within your radius instantly.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link to="/request/new">Create emergency request</Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="font-display text-3xl">{value}</dd>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
    </div>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-center gap-2">
      {icon}
      {text}
    </p>
  );
}
