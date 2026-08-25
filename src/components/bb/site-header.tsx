import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Droplets, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logout, useUser } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/find-donors", label: "Find Blood" },
  { to: "/register", label: "Become a Donor" },
] as const;

const APP_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/find-donors", label: "Find Donors" },
  { to: "/request/new", label: "Emergency Request" },
  { to: "/map", label: "Map" },
  { to: "/history", label: "History" },
  { to: "/profile", label: "Profile" },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Droplets className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-lg font-extrabold tracking-tight">BloodBridge</span>
    </Link>
  );
}

export function SiteHeader() {
  const user = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const links = user ? APP_LINKS : PUBLIC_LINKS;

  function handleLogout() {
    logout();
    setOpen(false);
    toast.success("Signed out of BloodBridge");
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Brand />

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname === l.to && "bg-muted text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <div className="mr-1 text-right leading-tight">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" aria-hidden /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[86vw] max-w-sm">
            <SheetTitle className="px-4 pt-4">
              <Brand />
            </SheetTitle>
            <nav className="mt-6 flex flex-col gap-1 px-4">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                    pathname === l.to && "bg-muted text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-2 px-4">
              {user ? (
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" aria-hidden /> Logout
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link to="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="shell flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Brand />
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Prototype built for demonstration. BloodBridge does not provide medical advice and does
            not replace licensed blood bank services.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/how-it-works" className="hover:text-foreground">
            How It Works
          </Link>
          <Link to="/find-donors" className="hover:text-foreground">
            Find Blood
          </Link>
          <Link to="/register" className="hover:text-foreground">
            Become a Donor
          </Link>
        </div>
      </div>
    </footer>
  );
}
