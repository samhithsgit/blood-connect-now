import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hydrateStore, useUser, type Role } from "@/lib/store";

export function useHydratedStore() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydrateStore();
    setReady(true);
  }, []);
  return ready;
}

export function RequireAuth({
  role,
  children,
}: {
  role?: Role;
  children: React.ReactNode;
}) {
  const ready = useHydratedStore();
  const user = useUser();

  if (!ready) {
    return (
      <div className="shell space-y-4 py-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="shell flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-4xl">Sign in to continue</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          This area of BloodBridge is protected so donor details stay private.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/register">Create account</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (role && user.role !== role) {
    return (
      <div className="shell flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-4xl">Wrong workspace</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          You are signed in as a {user.role}. This page is for {role}s.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Go to my dashboard</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
