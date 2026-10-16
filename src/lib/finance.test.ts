import { describe, expect, it } from "vitest";
import { bookingProfit, summarize } from "./finance";

describe("finance", () => {
  it("net profit = revenue − direct costs − referral bonus", () => {
    const b = { id: "b1", status: "completed", quote_total: 5000, updated_at: "2026-01-01" };
    const r = bookingProfit(b, [{ amount: 1200, booking_id: "b1", placement_id: null, spent_on: "" }], [{ amount: 200, status: "approved", booking_id: "b1", placement_id: null }]);
    expect(r.net).toBe(3600);
  });

  it("does not count refundable landlord deposits as revenue", () => {
    const s = summarize({
      bookings: [],
      placements: [{ id: "p", status: "completed", agreed_price: 5000, created_at: "", listings: { service_fee: 1500 } }],
      payments: [{ amount: 6500, status: "verified", kind: "placement", booking_id: null, placement_id: "p", created_at: "" }],
      expenses: [], rewards: [], payouts: [],
    });
    expect(s.revenue).toBe(1500);
    expect(s.cashIn).toBe(6500);
  });

  it("ignores unverified payments in cash collected", () => {
    const s = summarize({ bookings: [], placements: [], payments: [{ amount: 900, status: "pending", kind: "deposit", booking_id: null, placement_id: null, created_at: "" }], expenses: [], rewards: [], payouts: [] });
    expect(s.cashIn).toBe(0);
  });
});
