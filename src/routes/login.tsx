import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { login, type Role } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — BloodBridge" },
      { name: "description", content: "Sign in to your BloodBridge donor or seeker workspace." },
      { property: "og:title", content: "Login — BloodBridge" },
      { property: "og:description", content: "Access your BloodBridge dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Enter your email and password");
      return;
    }
    const user = login(email.trim(), role);
    toast.success(`Welcome back, ${user.name}`);
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="shell flex justify-center py-16">
      <Card className="w-full max-w-md gap-5 p-7 shadow-lift">
        <div>
          <h1 className="font-display text-4xl">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prototype login — any email and password works.
          </p>
        </div>

        <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
          <TabsList className="w-full">
            <TabsTrigger value="seeker" className="flex-1">
              Patient / Hospital
            </TabsTrigger>
            <TabsTrigger value="donor" className="flex-1">
              Donor
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" size="lg">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
