import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const search = z.object({ redirect: z.string().optional(), ref: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in or create an account — HomeShift" },
      { name: "description", content: "Sign in to manage bookings, payments and referral earnings." },
      { property: "og:title", content: "Sign in — HomeShift" },
      { property: "og:description", content: "Manage your bookings and referrals." },
    ],
  }),
  component: Auth,
});

const safe = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/dashboard");

function Auth() {
  const { redirect, ref } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">(ref ? "up" : "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(ref ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ref) localStorage.setItem("hs_ref", ref);
    else { const r = localStorage.getItem("hs_ref"); if (r) setCode(r); }
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: safe(redirect) }); });
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") navigate({ to: safe(redirect) }); });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name, phone, ref: code.trim() } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Password reset link sent.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="bg-warm">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-12">
        <form onSubmit={submit} className="w-full space-y-4 rounded-3xl bg-card p-8 shadow-lift">
          <h1 className="text-3xl font-semibold">{mode === "in" ? "Welcome back" : mode === "up" ? "Create your account" : "Reset password"}</h1>
          {mode === "up" && (
            <>
              <div><Label>Full name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Phone</Label><Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" /></div>
            </>
          )}
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {mode !== "forgot" && <div><Label>Password</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>}
          {mode === "up" && <div><Label>Referral code (optional)</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></div>}
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}</Button>
          {mode !== "forgot" && <Button type="button" variant="cream" className="w-full" onClick={google}>Continue with Google</Button>}
          <div className="flex justify-between text-sm">
            <button type="button" className="text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Create an account" : "I have an account"}</button>
            {mode === "in" && <button type="button" className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
