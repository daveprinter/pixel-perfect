import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { StatusPill, MessageThread } from "@/routes/_authenticated/dashboard";
import { date, downloadCSV, kes, nice } from "@/lib/format";
import { audit, Card, nameOf, sel, useRefresh, type AdminData } from "./shared";
import type { Database } from "@/integrations/supabase/types";

const BOOKING_STATUSES: Database["public"]["Enums"]["booking_status"][] = ["draft", "awaiting_quotation", "awaiting_deposit", "confirmed", "scheduled", "in_progress", "completed", "cancelled", "refunded"];

export function Bookings({ d }: { d: AdminData }) {
  const refresh = useRefresh();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const list = d.bookings.filter((b) => filter === "all" || b.status === filter);

  const update = async (id: string, patch: Partial<Database["public"]["Tables"]["bookings"]["Update"]>) => {
    const { error } = await supabase.from("bookings").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    await audit("booking_update", { id, ...patch });
    toast.success("Booking updated"); refresh();
  };

  return (
    <Card title="Moving bookings" action={<div className="flex gap-2"><select className={sel} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option>{BOOKING_STATUSES.map((s) => <option key={s} value={s}>{nice(s)}</option>)}</select><Button size="sm" variant="cream" onClick={() => downloadCSV("bookings", d.bookings)}>CSV</Button><Button size="sm" variant="cream" onClick={() => window.print()}>PDF</Button></div>}>
      <div className="space-y-2">
        {list.map((b) => (
          <div key={b.id} className="rounded-xl border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button className="text-left" onClick={() => setOpen(open === b.id ? null : b.id)}>
                <p className="font-semibold">{b.reference} <StatusPill s={b.status} /> {b.needs_manual_quote && <span className="text-xs text-warning-foreground">manual quote</span>}</p>
                <p className="text-xs text-muted-foreground">{nameOf(d, b.user_id)} · {b.phone} · {b.origin} → {b.destination} · {date(b.move_date)} {b.move_time}</p>
              </button>
              <div className="flex items-center gap-2 text-sm"><span className="font-semibold">{kes(b.quote_total)}</span>
                <select className={sel} value={b.status} onChange={(e) => update(b.id, { status: e.target.value as never })}>{BOOKING_STATUSES.map((s) => <option key={s} value={s}>{nice(s)}</option>)}</select>
              </div>
            </div>
            {open === b.id && <BookingDetail b={b} d={d} onSave={update} />}
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">No bookings.</p>}
      </div>
    </Card>
  );
}

function BookingDetail({ b, d, onSave }: { b: AdminData["bookings"][number]; d: AdminData; onSave: (id: string, p: Record<string, unknown>) => void }) {
  const refresh = useRefresh();
  const [total, setTotal] = useState(String(b.quote_total ?? ""));
  const [deposit, setDeposit] = useState(String(b.deposit_required ?? ""));
  const [team, setTeam] = useState(b.assigned_team ?? "");
  const [moveDate, setMoveDate] = useState(b.move_date ?? "");
  const [cat, setCat] = useState("transport");
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  const costs = d.expenses.filter((e) => e.booking_id === b.id);
  const items = (b.items as { key: string; qty: number; size?: string; note?: string }[]) ?? [];

  const addCost = async () => {
    const n = Number(amt);
    if (!(n >= 0) || !amt) return;
    const { error } = await supabase.from("expenses").insert({ booking_id: b.id, category: cat, amount: n, description: desc });
    if (error) return toast.error(error.message);
    await audit("expense_add", { booking: b.reference, cat, n });
    setAmt(""); setDesc(""); refresh();
  };

  return (
    <div className="mt-3 grid gap-4 border-t border-border pt-3 text-sm md:grid-cols-2">
      <div>
        <p><b>From:</b> {b.origin} — {b.origin_detail}</p>
        <p><b>To:</b> {b.destination} — {b.destination_detail}</p>
        <p><b>Floors:</b> {b.floor_level} · <b>Handling:</b> {b.special_handling || "—"}</p>
        <p><b>Notes:</b> {b.notes || "—"}</p>
        <ul className="mt-2 list-disc pl-5">{items.map((i, k) => <li key={k}>{nice(i.key)} × {i.qty}{i.size ? ` (${i.size})` : ""}{i.note ? ` — ${i.note}` : ""}</li>)}</ul>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2"><div><label className="text-xs">Quote total</label><Input value={total} onChange={(e) => setTotal(e.target.value)} /></div><div><label className="text-xs">Deposit</label><Input value={deposit} onChange={(e) => setDeposit(e.target.value)} /></div></div>
        <div className="grid grid-cols-2 gap-2"><div><label className="text-xs">Assigned team</label><Input value={team} onChange={(e) => setTeam(e.target.value)} /></div><div><label className="text-xs">Move date</label><Input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} /></div></div>
        <Button size="sm" variant="hero" onClick={() => onSave(b.id, {
          quote_total: total ? Number(total) : null, deposit_required: deposit ? Number(deposit) : null, assigned_team: team, move_date: moveDate || null,
          ...(b.status === "awaiting_quotation" && total && deposit ? { status: "awaiting_deposit", needs_manual_quote: false } : {}),
        })}>Save quote / schedule</Button>
        <div className="rounded-lg bg-secondary/60 p-2">
          <p className="font-semibold">Actual costs</p>
          {costs.map((c) => <p key={c.id} className="text-xs">{nice(c.category)} · {kes(c.amount)} {c.description}</p>)}
          <div className="mt-2 flex gap-1"><select className={sel} value={cat} onChange={(e) => setCat(e.target.value)}>{["transport", "labour", "fuel", "other"].map((c) => <option key={c}>{c}</option>)}</select><Input placeholder="KES" value={amt} onChange={(e) => setAmt(e.target.value)} /><Input placeholder="Note" value={desc} onChange={(e) => setDesc(e.target.value)} /><Button size="sm" onClick={addCost}>Add</Button></div>
        </div>
      </div>
    </div>
  );
}

export function Placements({ d }: { d: AdminData }) {
  const refresh = useRefresh();
  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("placement_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    await audit("placement_update", { id, status }); refresh();
  };
  return (
    <Card title="Placement requests" action={<Button size="sm" variant="cream" onClick={() => downloadCSV("placements", d.placements)}>CSV</Button>}>
      <div className="space-y-2">{d.placements.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
          <div><p className="font-semibold">{p.listings?.name ?? "Listing removed"} <StatusPill s={p.status} /></p><p className="text-xs text-muted-foreground">{nameOf(d, p.user_id)} · {p.phone} · {date(p.created_at)} · {p.message}</p></div>
          <select className={sel} value={p.status} onChange={(e) => update(p.id, e.target.value)}>{["pending", "approved", "placed", "completed", "rejected", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select>
        </div>))}
        {d.placements.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
      </div>
    </Card>
  );
}

export function Payments({ d }: { d: AdminData }) {
  const refresh = useRefresh();
  const [bk, setBk] = useState("");
  const [amt, setAmt] = useState("");
  const [kind, setKind] = useState("balance");
  const [ref, setRef] = useState("");
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("payments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    await audit("payment_status", { id, status }); toast.success(`Payment ${status}`); refresh();
  };
  const record = async () => {
    const b = d.bookings.find((x) => x.reference === bk.trim().toUpperCase());
    if (!b || !(Number(amt) > 0)) return toast.error("Enter a valid booking reference and amount");
    const { error } = await supabase.from("payments").insert({ user_id: b.user_id, booking_id: b.id, amount: Number(amt), kind, method: "mpesa", provider_ref: ref, status: "pending" });
    if (error) return toast.error(error.message);
    await audit("payment_recorded", { ref: bk, amt, kind }); setBk(""); setAmt(""); setRef(""); refresh();
  };
  return (
    <div className="space-y-4">
      <Card title="Record a payment or refund">
        <p className="mb-2 text-xs text-muted-foreground">Recorded as pending. Mark verified only after confirming the transaction with M-PESA / your bank statement.</p>
        <div className="flex flex-wrap gap-2"><Input className="w-36" placeholder="Booking ref" value={bk} onChange={(e) => setBk(e.target.value)} /><Input className="w-28" placeholder="KES" value={amt} onChange={(e) => setAmt(e.target.value)} /><select className={sel} value={kind} onChange={(e) => setKind(e.target.value)}>{["deposit", "balance", "refund"].map((k) => <option key={k}>{k}</option>)}</select><Input className="w-40" placeholder="Transaction code" value={ref} onChange={(e) => setRef(e.target.value)} /><Button size="sm" onClick={record}>Record</Button></div>
      </Card>
      <Card title="Payments" action={<Button size="sm" variant="cream" onClick={() => downloadCSV("payments", d.payments)}>CSV</Button>}>
        <div className="space-y-2">{d.payments.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
            <div><p className="font-semibold">{kes(p.amount)} · {nice(p.kind)} <StatusPill s={p.status} /></p><p className="text-xs text-muted-foreground">{p.bookings?.reference} · {nameOf(d, p.user_id)} · {p.method.toUpperCase()} {p.provider_ref} · {date(p.created_at)}</p></div>
            {p.status === "pending" && <div className="flex gap-2"><Button size="sm" variant="hero" onClick={() => setStatus(p.id, "verified")}>Verify</Button><Button size="sm" variant="outline" onClick={() => setStatus(p.id, "failed")}>Reject</Button></div>}
            {p.status === "verified" && p.kind !== "refund" && <Button size="sm" variant="ghost" onClick={() => setStatus(p.id, "refunded")}>Mark refunded</Button>}
          </div>))}
          {d.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
        </div>
      </Card>
    </div>
  );
}

export function Expenses({ d }: { d: AdminData }) {
  const refresh = useRefresh();
  const [cat, setCat] = useState("advertising");
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  const [on, setOn] = useState(new Date().toISOString().slice(0, 10));
  const add = async () => {
    if (!(Number(amt) >= 0) || !amt) return;
    const { error } = await supabase.from("expenses").insert({ category: cat, amount: Number(amt), description: desc, spent_on: on });
    if (error) return toast.error(error.message);
    await audit("expense_add", { cat, amt }); setAmt(""); setDesc(""); refresh();
  };
  const del = async (id: string) => { await supabase.from("expenses").delete().eq("id", id); await audit("expense_delete", { id }); refresh(); };
  return (
    <Card title="Business expenses" action={<Button size="sm" variant="cream" onClick={() => downloadCSV("expenses", d.expenses)}>CSV</Button>}>
      <div className="mb-3 flex flex-wrap gap-2"><select className={sel} value={cat} onChange={(e) => setCat(e.target.value)}>{["transport", "labour", "fuel", "listing_deposit", "advertising", "other"].map((c) => <option key={c}>{c}</option>)}</select><Input className="w-28" placeholder="KES" value={amt} onChange={(e) => setAmt(e.target.value)} /><Input className="w-56" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} /><Input type="date" className="w-40" value={on} onChange={(e) => setOn(e.target.value)} /><Button size="sm" onClick={add}>Add</Button></div>
      <table className="w-full text-sm"><tbody>{d.expenses.map((e) => <tr key={e.id} className="border-t border-border"><td className="py-1">{date(e.spent_on)}</td><td>{nice(e.category)}</td><td>{e.description}</td><td>{e.booking_id ? d.bookings.find((b) => b.id === e.booking_id)?.reference : "overhead"}</td><td className="text-right">{kes(e.amount)}</td><td><Button size="sm" variant="ghost" onClick={() => del(e.id)}>×</Button></td></tr>)}</tbody></table>
    </Card>
  );
}

export function Messages({ d, uid }: { d: AdminData; uid: string }) {
  const refresh = useRefresh();
  const update = async (id: string, patch: { status?: string; assigned_to?: string }) => { await supabase.from("support_messages").update(patch).eq("id", id); refresh(); };
  return (
    <div className="space-y-3">
      {d.messages.map((m) => (
        <div key={m.id}>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{nameOf(d, m.user_id)} · {nice(m.topic)} · {date(m.created_at)}</span>
            <select className={sel} value={m.status} onChange={(e) => update(m.id, { status: e.target.value })}>{["pending", "in_progress", "resolved"].map((s) => <option key={s}>{s}</option>)}</select>
            <Input className="h-8 w-40" placeholder="Assign to" defaultValue={m.assigned_to ?? ""} onBlur={(e) => e.target.value !== (m.assigned_to ?? "") && update(m.id, { assigned_to: e.target.value })} />
          </div>
          <MessageThread m={m} uid={uid} onSent={refresh} admin />
        </div>
      ))}
      {d.messages.length === 0 && <p className="text-sm text-muted-foreground">No messages.</p>}
    </div>
  );
}
