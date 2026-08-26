import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/bb/page";
import { BLOOD_GROUPS, canDonate, DONATION_COOLDOWN_DAYS } from "@/lib/blood";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How BloodBridge Works — Matching Logic Explained" },
      {
        name: "description",
        content:
          "See how BloodBridge ranks donors using ABO/Rh compatibility, distance, 90-day eligibility cooldown and availability.",
      },
      { property: "og:title", content: "How BloodBridge Works" },
      {
        property: "og:description",
        content: "Compatibility, distance, eligibility and availability — the BloodBridge match engine.",
      },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { n: 1, t: "Post the need", d: "Patient blood group, units, hospital, urgency and required-by time." },
  { n: 2, t: "Filter compatibility", d: "Only donor groups whose red cells can be transfused survive the gate." },
  { n: 3, t: "Rank by proximity", d: "Great-circle distance from the hospital, capped by your chosen radius." },
  { n: 4, t: "Check eligibility", d: `Donors inside the ${DONATION_COOLDOWN_DAYS}-day cooldown are demoted with a countdown.` },
  { n: 5, t: "Notify and track", d: "Donors accept, contact unlocks, and the request moves to fulfilled." },
];

function HowItWorks() {
  return (
    <div className="shell pb-20">
      <PageHeader
        eyebrow="Transparency"
        title="How the match engine works"
        description="Nothing is a black box — here is every rule BloodBridge applies, in order."
        actions={
          <Button asChild>
            <Link to="/find-donors">Try the search</Link>
          </Button>
        }
      />

      <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s) => (
          <Card key={s.n} className="gap-1 p-5 shadow-soft">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {s.n}
            </span>
            <h3 className="mt-2 font-bold">{s.t}</h3>
            <p className="text-sm text-muted-foreground">{s.d}</p>
          </Card>
        ))}
      </ol>

      <h2 className="mt-14 font-display text-3xl">Red-cell compatibility matrix</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Rows are recipients, columns are donors. A check means the transfusion is compatible.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left font-semibold">Recipient \ Donor</th>
              {BLOOD_GROUPS.map((g) => (
                <th key={g} className="p-2 font-semibold">
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOOD_GROUPS.map((r) => (
              <tr key={r} className="border-t border-border">
                <th className="p-2 text-left font-semibold">{r}</th>
                {BLOOD_GROUPS.map((d) => (
                  <td key={d} className="p-2 text-center">
                    {canDonate(d, r) ? (
                      <Check className="mx-auto h-4 w-4 text-success" aria-label="compatible" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="not compatible" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card className="mt-10 gap-2 p-6">
        <h3 className="font-bold">Safety notice</h3>
        <p className="text-sm text-muted-foreground">
          BloodBridge is a hackathon prototype. Compatibility and eligibility logic is simplified and
          must be confirmed by qualified medical staff and a licensed blood bank before any
          transfusion.
        </p>
      </Card>
    </div>
  );
}
