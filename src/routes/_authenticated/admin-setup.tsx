import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redeemAdminCode } from "@/lib/api.functions";

export const Route = createFileRoute("/_authenticated/admin-setup")({
  head: () => ({ meta: [{ title: "Admin activation — HomeShift" }, { name: "description", content: "Activate administrator access." }, { property: "og:title", content: "Admin activation" }, { property: "og:description", content: "Activate administrator access." }, { name: "robots", content: "noindex" }] }),
  component: Setup,
});

function Setup() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const go = async () => {
    setBusy(true);
    try {
      await redeemAdminCode({ data: { code } });
      toast.success("Admin access granted");
      window.location.href = "/admin";
    } catch (e) { toast.error((e as Error).message); setCode(""); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-20">
      <h1 className="text-3xl font-semibold">Activate admin access</h1>
      <p className="text-sm text-muted-foreground">Enter a one-time setup code while signed in to your own account. Each code works once and can be revoked by an administrator.</p>
      <Input type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Setup code" />
      <div className="flex gap-2"><Button variant="hero" disabled={busy || code.length < 4} onClick={go}>Activate</Button><Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button></div>
    </div>
  );
}
