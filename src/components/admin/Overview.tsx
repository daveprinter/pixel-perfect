import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { bookingProfit, periodKey, summarize, type Period } from "@/lib/finance";
import { downloadCSV, kes } from "@/lib/format";
import { Card, type AdminData } from "./shared";

export function Overview({ d }: { d: AdminData }) {
  const [period, setPeriod] = useState<Period>("month");
  const s = summarize(d as never);
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();
  const count = (st: string[]) => d.bookings.filter((b) => st.includes(b.status)).length;

  const series = useMemo(() => {
    const m = new Map<string, { period: string; revenue: number; costs: number; cash: number }>();
    const get = (k: string) => m.get(k) ?? m.set(k, { period: k, revenue: 0, costs: 0, cash: 0 }).get(k)!;
    d.bookings.filter((b) => b.status === "completed").forEach((b) => (get(periodKey(b.updated_at, period)).revenue += Number(b.quote_total ?? 0)));
    d.placements.filter((p) => p.status === "completed" || p.status === "placed").forEach((p) => (get(periodKey(p.created_at, period)).revenue += Number(p.listings?.service_fee ?? 0)));
    d.expenses.forEach((e) => (get(periodKey(e.spent_on, period)).costs += Number(e.amount)));
    d.payments.filter((p) => p.status === "verified" && p.kind !== "refund").forEach((p) => (get(periodKey(p.created_at, period)).cash += Number(p.amount)));
    return [...m.values()].sort((a, b) => a.period.localeCompare(b.period)).map((r) => ({ ...r, profit: r.revenue - r.costs }));
  }, [d, period]);

  const completed = d.bookings.filter((b) => b.status === "completed").map((b) => ({ b, ...bookingProfit(b, d.expenses, d.rewards) }));
  const allocated = d.expenses.filter((e) => !e.booking_id && !e.placement_id).reduce((a, e) => a + Number(e.amount), 0);

  const kpis: [string, string | number, string?][] = [
    ["Registered clients", d.profiles.length],
    ["New customers (30d)", d.profiles.filter((p) => p.created_at >= monthAgo).length],
    ["Placement requests", d.placements.length],
    ["Moving bookings", d.bookings.length],
    ["Completed services", count(["completed"]) + d.placements.filter((p) => p.status === "completed").length],
    ["Pending services", count(["awaiting_quotation", "awaiting_deposit", "confirmed", "scheduled", "in_progress"])],
    ["Cancelled bookings", count(["cancelled", "refunded"])],
    ["Cash collected", kes(s.cashIn), "Verified payments received"],
    ["Deposits collected", kes(s.deposits)],
    ["Refunds issued", kes(s.refunds)],
    ["Outstanding balances", kes(s.outstanding)],
    ["Gross revenue earned", kes(s.revenue), "Completed moves + service fees (excl. refundable deposits)"],
    ["Business expenses", kes(s.expenses)],
    ["Referral bonuses earned / paid", `${kes(s.bonusEarned)} / ${kes(s.bonusPaid)}`],
    ["Net operating profit", kes(s.net), "Revenue − expenses − referral bonuses"],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map(([k, v, hint]) => <div key={k} className="rounded-2xl bg-card p-4 shadow-soft"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-xl font-bold">{v}</p>{hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}</div>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="By service category">
          <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th>Category</th><th>Revenue</th><th>Direct costs</th><th>Profit</th></tr></thead><tbody>
            <tr><td>Moving</td><td>{kes(s.movingRevenue)}</td><td>{kes(s.movingCosts)}</td><td>{kes(s.movingRevenue - s.movingCosts)}</td></tr>
            <tr><td>Placement</td><td>{kes(s.placementRev)}</td><td>{kes(s.placementCosts)}</td><td>{kes(s.placementRev - s.placementCosts)}</td></tr>
            <tr className="text-muted-foreground"><td>Unallocated overhead</td><td>—</td><td>{kes(allocated)}</td><td>−{kes(allocated)}</td></tr>
          </tbody></table>
        </Card>
        <Card title="Revenue & profit over time" action={<div className="flex gap-1">{(["day", "week", "month", "year"] as Period[]).map((p) => <Button key={p} size="sm" variant={p === period ? "default" : "ghost"} onClick={() => setPeriod(p)}>{p}</Button>)}</div>}>
          <div className="h-60">
            <ResponsiveContainer><BarChart data={series}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="period" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Legend />
              <Bar dataKey="revenue" fill="var(--chart-1)" /><Bar dataKey="costs" fill="var(--chart-3)" /><Bar dataKey="profit" fill="var(--chart-4)" /><Bar dataKey="cash" fill="var(--chart-2)" />
            </BarChart></ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card title="Profit per completed move" action={<Button size="sm" variant="cream" onClick={() => downloadCSV("profit-per-move", completed.map((c) => ({ reference: c.b.reference, revenue: c.revenue, direct_costs: c.direct, referral_bonus: c.bonus, net: c.net })))}>Export CSV</Button>}>
        <p className="mb-2 text-xs text-muted-foreground">Net = earned revenue − direct operating costs − referral bonus. Unallocated overhead ({kes(allocated)}) is deducted at business level.</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th>Ref</th><th>Revenue</th><th>Direct costs</th><th>Referral</th><th>Net</th></tr></thead><tbody>
          {completed.map((c) => <tr key={c.b.id} className="border-t border-border"><td className="py-1">{c.b.reference}</td><td>{kes(c.revenue)}</td><td>{kes(c.direct)}</td><td>{kes(c.bonus)}</td><td className="font-semibold">{kes(c.net)}</td></tr>)}
          {completed.length === 0 && <tr><td colSpan={5} className="py-3 text-muted-foreground">No completed moves yet.</td></tr>}
        </tbody></table></div>
      </Card>
    </div>
  );
}
