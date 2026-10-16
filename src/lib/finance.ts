// Pure finance calculations used by the admin dashboard. All figures derive from stored records.
export interface FinBooking { id: string; status: string; quote_total: number | null; updated_at: string }
export interface FinPlacement { id: string; status: string; agreed_price: number | null; updated_at?: string; created_at: string; listings: { service_fee: number } | null }
export interface FinPayment { amount: number; status: string; kind: string; booking_id: string | null; placement_id: string | null; created_at: string }
export interface FinExpense { amount: number; booking_id: string | null; placement_id: string | null; spent_on: string }
export interface FinReward { amount: number; status: string; booking_id: string | null; placement_id: string | null }

export function placementRevenue(p: FinPlacement) {
  // Only the company's service fee is earned revenue; landlord deposits are pass-through and refundable.
  return Number(p.listings?.service_fee ?? 0);
}

export function bookingProfit(b: FinBooking, expenses: FinExpense[], rewards: FinReward[]) {
  const revenue = b.status === "completed" ? Number(b.quote_total ?? 0) : 0;
  const direct = expenses.filter((e) => e.booking_id === b.id).reduce((s, e) => s + Number(e.amount), 0);
  const bonus = rewards.filter((r) => r.booking_id === b.id && r.status !== "rejected").reduce((s, r) => s + Number(r.amount), 0);
  return { revenue, direct, bonus, net: revenue - direct - bonus };
}

export function summarize(d: { bookings: FinBooking[]; placements: FinPlacement[]; payments: FinPayment[]; expenses: FinExpense[]; rewards: FinReward[]; payouts: { amount: number }[] }) {
  const verified = d.payments.filter((p) => p.status === "verified");
  const cashIn = verified.filter((p) => p.kind !== "refund").reduce((s, p) => s + Number(p.amount), 0);
  const refunds = verified.filter((p) => p.kind === "refund").reduce((s, p) => s + Number(p.amount), 0);
  const deposits = verified.filter((p) => p.kind === "deposit").reduce((s, p) => s + Number(p.amount), 0);
  const movingRevenue = d.bookings.filter((b) => b.status === "completed").reduce((s, b) => s + Number(b.quote_total ?? 0), 0);
  const placementRev = d.placements.filter((p) => p.status === "completed" || p.status === "placed").reduce((s, p) => s + placementRevenue(p), 0);
  const revenue = movingRevenue + placementRev;
  const outstanding = d.bookings
    .filter((b) => b.quote_total != null && !["cancelled", "refunded", "draft"].includes(b.status))
    .reduce((s, b) => {
      const paid = verified.filter((p) => p.booking_id === b.id && p.kind !== "refund").reduce((a, p) => a + Number(p.amount), 0);
      return s + Math.max(0, Number(b.quote_total) - paid);
    }, 0);
  const expenses = d.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const movingCosts = d.expenses.filter((e) => e.booking_id).reduce((s, e) => s + Number(e.amount), 0);
  const placementCosts = d.expenses.filter((e) => e.placement_id).reduce((s, e) => s + Number(e.amount), 0);
  const bonusEarned = d.rewards.filter((r) => r.status === "approved" || r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
  const bonusPaid = d.payouts.reduce((s, p) => s + Number(p.amount), 0);
  const net = revenue - expenses - bonusEarned;
  return { cashIn, refunds, deposits, revenue, movingRevenue, placementRev, outstanding, expenses, movingCosts, placementCosts, bonusEarned, bonusPaid, net };
}

export type Period = "day" | "week" | "month" | "year";
export function periodKey(iso: string, p: Period) {
  const d = new Date(iso);
  if (p === "day") return d.toISOString().slice(0, 10);
  if (p === "month") return d.toISOString().slice(0, 7);
  if (p === "year") return String(d.getUTCFullYear());
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return `wk ${t.toISOString().slice(0, 10)}`;
}
