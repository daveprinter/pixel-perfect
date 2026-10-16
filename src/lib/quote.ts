export const LOCATIONS = [
  { value: "SEKU", label: "SEKU hostels" },
  { value: "Kwa Vonza (KU)", label: "Kenyatta University – Kwa Vonza" },
  { value: "Kwa Vonza town", label: "Kwa Vonza town" },
  { value: "Kitui town", label: "Kitui town" },
  { value: "Wote town", label: "Wote town" },
  { value: "Other", label: "Other location" },
] as const;

export const ITEM_TYPES = [
  { key: "bed", label: "Bed", sizes: ["3x6", "4x6", "5x6", "6x6"] },
  { key: "mattress", label: "Mattress", sizes: ["3x6", "4x6", "5x6", "6x6"] },
  { key: "sofa", label: "Sofa / couch", sizes: ["1-seater", "2-seater", "3-seater", "L-shape"] },
  { key: "gas_cylinder", label: "Gas cylinder", sizes: ["6kg", "13kg"] },
  { key: "television", label: "Television", sizes: ['24"', '32"', '43"', '50"+'] },
  { key: "wardrobe", label: "Wardrobe", sizes: ["Small", "Large"] },
  { key: "table_chairs", label: "Table and chairs", sizes: [] },
  { key: "fridge", label: "Fridge", sizes: ["Small", "Medium", "Large"] },
  { key: "washing_machine", label: "Washing machine", sizes: [] },
  { key: "kitchen", label: "Kitchen equipment", sizes: [] },
  { key: "boxes", label: "Boxes & personal belongings", sizes: [] },
  { key: "other", label: "Other item", sizes: [] },
] as const;

export type ItemKey = (typeof ITEM_TYPES)[number]["key"];

export interface BookingItem {
  key: string;
  qty: number;
  size?: string;
  note?: string;
}

export interface PricingRules {
  deposit_percent: number;
  base_fee: number;
  routes: Record<string, number>;
  items: Record<string, number>;
  per_floor: number;
}

export interface QuoteInput {
  origin: string;
  destination: string;
  items: BookingItem[];
  tvMounting: boolean;
  floorLevel: number;
}

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface Quote {
  lines: QuoteLine[];
  total: number | null;
  deposit: number | null;
  needsManual: boolean;
  reasons: string[];
}

export function routePrice(rules: PricingRules, a: string, b: string): number | null {
  if (a === b) return rules.routes.same ?? null;
  return rules.routes[`${a}|${b}`] ?? rules.routes[`${b}|${a}`] ?? null;
}

export function calculateQuote(rules: PricingRules, input: QuoteInput): Quote {
  const reasons: string[] = [];
  const lines: QuoteLine[] = [];

  if (input.origin === "Other" || input.destination === "Other") {
    reasons.push("Custom location needs a manual assessment");
  } else {
    const r = routePrice(rules, input.origin, input.destination);
    if (r == null) reasons.push("No price set for this route yet");
    else lines.push({ label: `Transport: ${input.origin} → ${input.destination}`, amount: r });
  }

  if (rules.base_fee > 0) lines.push({ label: "Booking & handling fee", amount: rules.base_fee });

  for (const it of input.items) {
    const qty = Math.max(0, Math.floor(it.qty || 0));
    if (qty === 0) continue;
    if (it.key === "other") {
      reasons.push(`"${it.note || "Other item"}" needs a manual price`);
      continue;
    }
    const unit = rules.items[it.key];
    if (unit == null) {
      reasons.push(`No price set for ${it.key}`);
      continue;
    }
    const label = ITEM_TYPES.find((t) => t.key === it.key)?.label ?? it.key;
    lines.push({ label: `${label}${it.size ? ` (${it.size})` : ""} × ${qty}`, amount: unit * qty });
  }

  if (input.tvMounting) {
    const m = rules.items.tv_mounting;
    if (m == null) reasons.push("TV mounting needs a manual price");
    else lines.push({ label: "TV mounting at destination", amount: m });
  }

  const floors = Math.max(0, Math.floor(input.floorLevel || 0));
  if (floors > 0 && rules.per_floor > 0) {
    lines.push({ label: `Stairs (${floors} floor${floors > 1 ? "s" : ""})`, amount: rules.per_floor * floors });
  }

  const needsManual = reasons.length > 0;
  const total = needsManual ? null : lines.reduce((s, l) => s + l.amount, 0);
  const deposit = total == null ? null : Math.round((total * rules.deposit_percent) / 100);
  return { lines, total, deposit, needsManual, reasons };
}
