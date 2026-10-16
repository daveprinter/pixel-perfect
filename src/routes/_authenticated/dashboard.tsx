import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, Copy, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { date, kes, nice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My account — HomeShift" }, { name: "description", content: "Your bookings, payments, receipts and referrals." }, { property: "og:title", content: "My account — HomeShift" }, { property: "og:description", content: "Bookings, payments and referrals." }] }),
  component: Dashboard,
});

export function StatusPill({ s }: { s: string }) {
  const tone = ["completed", "verified", "paid", "approved", "resolved", "placed", "confirmed"].includes(s) ? "bg-success/15 text-success"
    : ["cancelled", "refunded", "rejected", "failed"].includes(s) ? "bg-destructive/10 text-destructive" : "bg-warning/30 text-warning-foreground";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{nice(s)}</span>;
}

function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const uid = user?.id;
  const { data } = useQuery({
    queryKey: ["me", uid],
    enabled: !!uid,
    queryFn: async () => {
      const [profile, bookings, placements, payments, rewards, payouts, messages, notifs] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid!).single(),
        supabase.from("bookings").select("*").eq("user_id", uid!).order("created_at", { ascending: false }),
        supabase.from("placement_requests").select("*, listings(name, location)").eq("user_id", uid!).order("created_at", { ascending: false }),
        supabase.from("payments").select("*, bookings(reference)").eq("user_id", uid!).order("created_at", { ascending: false }),
        supabase.from("referral_rewards").select("*").eq("referrer_id", uid!).order("created_at", { ascending: false }),
        supabase.from("referral_payouts").select("*").eq("referrer_id", uid!).order("created_at", { ascending: false }),
        supabase.from("support_messages").select("*, message_replies(*)").eq("user_id", uid!).order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").eq("user_id", uid!).order("created_at", { ascending: false }).limit(20),
      ]);
      return { profile: profile.data, bookings: bookings.data ?? [], placements: placements.data ?? [], payments: payments.data ?? [], rewards: rewards.data ?? [], payouts: payouts.data ?? [], messages: messages.data ?? [], notifs: notifs.data ?? [] };
    },
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  useEffect(() => { if (data?.profile) { setName(data.profile.full_name ?? ""); setPhone(data.profile.phone ?? ""); } }, [data?.profile]);
  if (!data) return <p className="p-10 text-center text-muted-foreground">Loading your account…</p>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["me", uid] });
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = data.bookings.filter((b) => b.move_date && b.move_date >= today && !["completed", "cancelled", "refunded"].includes(b.status));
  const earned = data.rewards.filter((r) => r.status === "approved" || r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
  const pendingR = data.rewards.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
  const paidOut = data.payouts.reduce((s, p) => s + Number(p.amount), 0);
  const link = typeof window !== "undefined" ? `${window.location.origin}/auth?ref=${data.profile?.referral_code}` : "";
  const unread = data.notifs.filter((n) => !n.read).length;

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ full_name: name.slice(0, 100), phone: phone.slice(0, 20) }).eq("id", uid!);
    if (error) toast.error("Could not save"); else { toast.success("Profile saved"); refresh(); }
  };
  const markRead = async () => { await supabase.from("notifications").update({ read: true }).eq("user_id", uid!).eq("read", false); refresh(); };
  const r = data.payments.find((p) => p.id === receipt);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Karibu,</p><h1 className="text-3xl font-semibold">{data.profile?.full_name || user?.email}</h1></div>
        <div className="flex gap-2">
          {isAdmin && <Button asChild variant="cocoa"><Link to="/admin">Admin dashboard</Link></Button>}
          <Button asChild variant="hero"><Link to="/book">Book a move</Link></Button>
          <Button asChild variant="cream"><Link to="/apartments">Find a room</Link></Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat k="Upcoming moves" v={upcoming.length} />
        <Stat k="Completed services" v={data.bookings.filter((b) => b.status === "completed").length + data.placements.filter((p) => p.status === "completed").length} />
        <Stat k="Referral earnings" v={kes(earned)} />
        <Stat k="Available to withdraw" v={kes(earned - paidOut)} />
      </div>

      <Tabs defaultValue="bookings" className="mt-8">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="bookings">Moves</TabsTrigger>
          <TabsTrigger value="placements">Room requests</TabsTrigger>
          <TabsTrigger value="payments">Payments & receipts</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="messages">Support</TabsTrigger>
          <TabsTrigger value="notifs">Notifications {unread > 0 && `(${unread})`}</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-3">
          {data.bookings.length === 0 && <Empty text="No moves yet." />}
          {data.bookings.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-5 shadow-soft">
              <div><p className="font-semibold">{b.reference} <StatusPill s={b.status} /></p><p className="text-sm text-muted-foreground">{b.origin} → {b.destination} · {date(b.move_date)} {b.move_time}</p></div>
              <div className="text-right"><p className="font-semibold">{b.quote_total == null ? "Quote pending" : kes(b.quote_total)}</p>
                <Link to="/pay/$bookingId" params={{ bookingId: b.id }} className="text-sm font-semibold text-primary">{b.status === "awaiting_deposit" ? "Pay deposit →" : "Details →"}</Link></div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="placements" className="space-y-3">
          {data.placements.length === 0 && <Empty text="No room requests yet." />}
          {data.placements.map((p) => (
            <div key={p.id} className="rounded-2xl bg-card p-5 shadow-soft"><p className="font-semibold">{p.listings?.name ?? "Room"} <StatusPill s={p.status} /></p><p className="text-sm text-muted-foreground">{p.listings?.location} · requested {date(p.created_at)}</p></div>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="space-y-3">
          {data.payments.length === 0 && <Empty text="No payments yet." />}
          {data.payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-5 shadow-soft">
              <div><p className="font-semibold">{kes(p.amount)} · {nice(p.kind)} <StatusPill s={p.status} /></p><p className="text-sm text-muted-foreground">{p.bookings?.reference} · {p.method.toUpperCase()} {p.provider_ref} · {date(p.created_at)}</p></div>
              {p.status === "verified" && <Button variant="cream" size="sm" onClick={() => setReceipt(p.id)}><Printer /> Receipt</Button>}
            </div>
          ))}
          {r && (
            <div className="print-area rounded-2xl border-2 border-dashed border-primary bg-card p-6">
              <h3 className="text-2xl">HomeShift — Receipt</h3>
              <p className="text-sm">Receipt ID: {r.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm">Booking: {r.bookings?.reference}</p>
              <p className="text-sm">Amount: {kes(r.amount)} ({nice(r.kind)})</p>
              <p className="text-sm">Method: {r.method.toUpperCase()} · Ref {r.provider_ref}</p>
              <p className="text-sm">Verified: {date(r.verified_at)}</p>
              <Button className="mt-4" size="sm" variant="hero" onClick={() => window.print()}>Print / Save as PDF</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <div className="rounded-2xl bg-warm p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">Your referral code</p>
            <p className="font-display text-3xl font-semibold">{data.profile?.referral_code}</p>
            <div className="mt-3 flex gap-2"><Input readOnly value={link} /><Button variant="hero" onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copied"); }}><Copy /> Copy</Button></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat k="Successful referrals" v={data.rewards.filter((x) => x.status !== "rejected").length} />
            <Stat k="Pending review" v={kes(pendingR)} />
            <Stat k="Total earned" v={kes(earned)} />
            <Stat k="Paid out" v={kes(paidOut)} />
          </div>
          <p className="text-xs text-muted-foreground">{settings?.terms.referral} Payout threshold: {kes(settings?.referral.payout_threshold)}.</p>
          <div className="rounded-2xl bg-card p-5 shadow-soft">
            <h3 className="font-semibold">Ledger</h3>
            <ul className="mt-2 divide-y divide-border text-sm">
              {data.rewards.map((x) => <li key={x.id} className="flex justify-between py-2"><span>Bonus · {date(x.created_at)} <StatusPill s={x.status} /></span><span>+{kes(x.amount)}</span></li>)}
              {data.payouts.map((x) => <li key={x.id} className="flex justify-between py-2"><span>Payout · {x.method.toUpperCase()} {x.reference} · {date(x.created_at)}</span><span>−{kes(x.amount)}</span></li>)}
              {data.rewards.length + data.payouts.length === 0 && <li className="py-2 text-muted-foreground">No referral activity yet.</li>}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-3">
          <Button asChild variant="hero" size="sm"><Link to="/contact">New message</Link></Button>
          {data.messages.map((m) => <MessageThread key={m.id} m={m} uid={uid!} onSent={refresh} />)}
          {data.messages.length === 0 && <Empty text="No messages yet." />}
        </TabsContent>

        <TabsContent value="notifs" className="space-y-2">
          {unread > 0 && <Button size="sm" variant="cream" onClick={markRead}>Mark all read</Button>}
          {data.notifs.map((n) => <div key={n.id} className={`flex gap-3 rounded-xl bg-card p-4 shadow-soft ${n.read ? "opacity-70" : ""}`}><Bell className="size-4 text-primary" /><div><p className="font-semibold">{n.title}</p><p className="text-sm text-muted-foreground">{n.body} · {date(n.created_at)}</p></div></div>)}
          {data.notifs.length === 0 && <Empty text="No notifications." />}
        </TabsContent>

        <TabsContent value="profile">
          <div className="max-w-md space-y-3 rounded-2xl bg-card p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            <Button variant="hero" onClick={saveProfile}>Save profile</Button>
            {!isAdmin && <p className="pt-4 text-xs text-muted-foreground">Staff member? <Link to="/admin-setup" className="text-primary">Activate admin access</Link></p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type Msg = { id: string; subject: string; body: string; status: string; created_at: string; message_replies: { id: string; body: string; is_admin: boolean; created_at: string }[] };

export function MessageThread({ m, uid, onSent, admin }: { m: Msg; uid: string; onSent: () => void; admin?: boolean }) {
  const [reply, setReply] = useState("");
  const send = async () => {
    if (!reply.trim()) return;
    const { error } = await supabase.from("message_replies").insert({ message_id: m.id, author_id: uid, is_admin: !!admin, body: reply.slice(0, 2000) });
    if (error) return toast.error("Could not send");
    setReply(""); onSent();
  };
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft">
      <p className="font-semibold">{m.subject} <StatusPill s={m.status} /></p>
      <p className="mt-1 text-sm">{m.body}</p>
      <div className="mt-3 space-y-2">
        {[...m.message_replies].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((r) => (
          <div key={r.id} className={`rounded-xl p-3 text-sm ${r.is_admin ? "bg-accent/50" : "ml-6 bg-secondary"}`}><span className="text-xs font-semibold">{r.is_admin ? "HomeShift" : "Customer"}</span><p>{r.body}</p></div>
        ))}
      </div>
      <div className="mt-3 flex gap-2"><Textarea rows={1} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" /><Button variant="hero" onClick={send}>Send</Button></div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string | number }) {
  return <div className="rounded-2xl bg-card p-5 shadow-soft"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>;
}
function Empty({ text }: { text: string }) { return <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground">{text}</p>; }
