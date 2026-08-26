import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOOD_GROUPS, type BloodGroup } from "@/lib/blood";
import { register, type Role } from "@/lib/store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register as a Blood Donor — BloodBridge" },
      {
        name: "description",
        content:
          "Join BloodBridge as a donor or as a patient/hospital seeker and help save lives nearby.",
      },
      { property: "og:title", content: "Register as a Blood Donor — BloodBridge" },
      {
        property: "og:description",
        content: "Create a BloodBridge account in under a minute.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("donor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [area, setArea] = useState("");
  const [lastDonation, setLastDonation] = useState("");
  const [available, setAvailable] = useState(true);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Name, email and phone are required");
      return;
    }
    if (role === "donor" && !area.trim()) {
      toast.error("Tell us your area so we can measure distance");
      return;
    }
    register(
      { role, name: name.trim(), email: email.trim(), phone: phone.trim() },
      role === "donor"
        ? { bloodGroup, area: area.trim(), lastDonationDate: lastDonation || null, available }
        : undefined,
    );
    toast.success(role === "donor" ? "You are on the donor network" : "Account created");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="shell flex justify-center py-16">
      <Card className="w-full max-w-xl gap-5 p-7 shadow-lift">
        <div>
          <h1 className="font-display text-4xl">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Donors get matched to nearby emergencies. Seekers can post requests instantly.
          </p>
        </div>

        <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
          <TabsList className="w-full">
            <TabsTrigger value="donor" className="flex-1">
              I want to donate
            </TabsTrigger>
            <TabsTrigger value="seeker" className="flex-1">
              I need blood
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Full name" value={name} onChange={setName} placeholder="Aarav Mehta" />
            <Field id="phone" label="Phone" value={phone} onChange={setPhone} placeholder="+91 98490 00000" />
          </div>
          <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

          {role === "donor" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Blood group</Label>
                  <Select value={bloodGroup} onValueChange={(v) => setBloodGroup(v as BloodGroup)}>
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
                <Field id="area" label="Area / locality" value={area} onChange={setArea} placeholder="Banjara Hills" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="last">Last donation date (optional)</Label>
                  <Input
                    id="last"
                    type="date"
                    value={lastDonation}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setLastDonation(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Label className="text-sm font-semibold">Available now</Label>
                    <p className="text-xs text-muted-foreground">You can pause anytime.</p>
                  </div>
                  <Switch checked={available} onCheckedChange={setAvailable} />
                </div>
              </div>
            </>
          )}

          <Button type="submit" size="lg">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
