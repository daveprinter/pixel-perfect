import { describe, expect, it } from "vitest";
import { calculateQuote, type PricingRules } from "./quote";

const rules: PricingRules = {
  deposit_percent: 30,
  base_fee: 500,
  routes: { same: 800, "SEKU|Kitui town": 3000 },
  items: { bed: 400, mattress: 200, tv_mounting: 800 },
  per_floor: 100,
};

describe("calculateQuote", () => {
  it("sums route, fee, items, mounting and floors with 30% deposit", () => {
    const q = calculateQuote(rules, {
      origin: "Kitui town",
      destination: "SEKU",
      items: [{ key: "bed", qty: 2 }, { key: "mattress", qty: 1 }],
      tvMounting: true,
      floorLevel: 2,
    });
    expect(q.total).toBe(3000 + 500 + 800 + 200 + 800 + 200);
    expect(q.deposit).toBe(Math.round(5500 * 0.3));
    expect(q.needsManual).toBe(false);
  });

  it("marks custom locations as pending approval with no invented price", () => {
    const q = calculateQuote(rules, { origin: "Other", destination: "SEKU", items: [], tvMounting: false, floorLevel: 0 });
    expect(q.needsManual).toBe(true);
    expect(q.total).toBeNull();
    expect(q.deposit).toBeNull();
  });

  it("marks 'other' items as needing manual pricing", () => {
    const q = calculateQuote(rules, { origin: "SEKU", destination: "SEKU", items: [{ key: "other", qty: 1, note: "Piano" }], tvMounting: false, floorLevel: 0 });
    expect(q.needsManual).toBe(true);
  });
});
