import { Link } from "@tanstack/react-router";
import { Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/apartments", label: "Apartments" },
  { to: "/services", label: "Services" },
  { to: "/referrals", label: "Refer & earn" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
            <Home className="size-4" />
          </span>
          HomeShift
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isAdmin && <Button asChild variant="ghost" size="sm"><Link to="/admin">Admin</Link></Button>}
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard">My account</Link></Button>
              <Button variant="cream" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
          )}
          <Button asChild variant="hero" size="sm"><Link to="/book">Book a move</Link></Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3" onClick={() => setOpen(false)}>
            {NAV.map((n) => <Link key={n.to} to={n.to} className="py-1 font-medium">{n.label}</Link>)}
            {user ? (
              <>
                <Link to="/dashboard" className="py-1 font-medium">My account</Link>
                {isAdmin && <Link to="/admin" className="py-1 font-medium">Admin</Link>}
                <button className="py-1 text-left font-medium" onClick={() => supabase.auth.signOut()}>Sign out</button>
              </>
            ) : (
              <Link to="/auth" className="py-1 font-medium">Sign in</Link>
            )}
            <Button asChild variant="hero"><Link to="/book">Book a move</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}
