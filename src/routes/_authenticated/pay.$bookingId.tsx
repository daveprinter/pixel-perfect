import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { submitPayment } from "@/lib/api.functions";
import { kes, nice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pay/$bookingId")({
  head: () => ({ meta: [{ title: "Pay booking deposit — HomeShift" }, { name: "description", content: "Pay your moving deposit securely." }, { property: "og:title", content: "Pay deposit — HomeShift" }, { property: "og:description", content: "Secure booking deposit payment." }] }),
  component: Pay,
});

function Pay() {
  const { bookingId } = Route.useParams();
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const [method, setMethod] = useState<"mpesa" | "bank" | "cash">("mpesa");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["pay", bookingId],
    queryFn: async () => {
      const [b, p] = await Promise.all([
        supabase.from("bookings").select("*").eq("id", bookingId).single(),
        supabase.from("payments").select("*").eq("booking_id", bookingId).order("created_at"),
      ]);
      return { b: b.data, payments: p.data ?? [] };
    },
  });
  const b = data?.b;
  if (!b) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  const verified = data.payments.filter((p) => p.status === "verified" && p.kind !== "refund").reduce((s, p) => s + Number(p.amount), 0);
  const pending = data.payments.find((p) => p.status === "pending");
  const balance = b.quote_total == null ? null : Number(b.quote_total) - verified;

  const pay = async () => {
    setBusy(true);
    try {
      await submitPayment({ data: { bookingId, method, providerRef: ref } });
      toast.success("Payment submitted. We'll confirm once it's verified.");
      qc.invalidateQueries({ queryKey: ["pay", bookingId] });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="bg-warm min-h-[80vh]">
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-3xl bg-card p-8 shadow-lift">
          <p className="text-sm text-muted-foreground">Booking reference</p>
          <h1 className="text-3xl font-semibold">{b.reference}</h1>
          <div className="mt-6 space-y-2 text-sm">
            <Row k="Total estimated price" v={kes(b.quote_total)} />
            <Row k="Required deposit" v={kes(b.deposit_required)} strong />
            <Row k="Paid & verified" v={kes(verified)} />
            <Row k="Remaining balance" v={kes(balance)} />
            <Row k="Booking status" v={nice(b.status)} />
            <Row k="Payment status" v={pending ? "Awaiting verification" : verified > 0 ? "Verified" : "Not paid"} />
          </div>
          {b.status === "awaiting_quotation" && <p className="mt-6 rounded-xl bg-warning/30 p-4 text-sm">Your quotation is being prepared. You'll be notified when it's ready to pay.</p>}
          {b.status === "awaiting_deposit" && !pending && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-secondary/60 p-4 text-sm">
                <p className="font-semibold">How to pay with M-PESA</p>
                <p className="mt-1">Send {kes(b.deposit_required)} to our M-PESA number {settings?.contacts.phone}, then enter the M-PESA confirmation code below. Your booking is confirmed once we verify the transaction.</p>
              </div>
              <div className="flex gap-2">
                {(["mpesa", "bank", "cash"] as const).map((m) => <button key={m} onClick={() => setMethod(m)} className={`rounded-full px-4 py-1.5 text-sm ${method === m ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{m === "mpesa" ? "M-PESA" : nice(m)}</button>)}
              </div>
              <div><Label>Transaction code</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. SJK3H2L9QX" /></div>
              <Button variant="hero" size="xl" className="w-full" disabled={busy || ref.trim().length < 6} onClick={pay}>Submit payment</Button>
            </div>
          )}
          {pending && <p className="mt-6 rounded-xl bg-accent/60 p-4 text-sm">We received your payment reference <b>{pending.provider_ref}</b>. It will show as confirmed once verified.</p>}
          <p className="mt-6 text-xs text-muted-foreground"><b>Refund & cancellation:</b> {settings?.terms.moving}</p>
          <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-primary">Go to my account →</Link>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? "font-bold text-primary" : ""}`}><span className={strong ? "" : "text-muted-foreground"}>{k}</span><span>{v}</span></div>;
}
