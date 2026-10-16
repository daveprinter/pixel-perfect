import { createFileRoute, Link } from "@tanstack/react-router";
import { Bed, Building2, Package, Sofa, Truck, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { kes } from "@/lib/format";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & pricing — HomeShift" },
      { name: "description", content: "Apartment placement, basic room setups, moving and TV mounting across Kitui and Makueni." },
      { property: "og:title", content: "Services & pricing — HomeShift" },
      { property: "og:description", content: "Placement, room setups, moving and TV mounting." },
    ],
  }),
  component: Services,
});

const services = [
  { icon: Building2, title: "Apartment placement", text: "We find and reserve a verified room for you, so you skip the hunt." },
  { icon: Bed, title: "Basic room setup", text: "Rooms pre-fitted with bed, mattress and gas cylinder." },
  { icon: Truck, title: "Moving services", text: "Hostel, campus and town moves with careful handling." },
  { icon: Tv, title: "TV mounting", text: "We mount your TV at your new home, priced separately." },
];

const itemLabels: Record<string, string> = { bed: "Bed", mattress: "Mattress", sofa: "Sofa", gas_cylinder: "Gas cylinder", television: "Television", tv_mounting: "TV mounting", wardrobe: "Wardrobe", table_chairs: "Table & chairs", fridge: "Fridge", washing_machine: "Washing machine", kitchen: "Kitchen equipment", boxes: "Boxes (each)" };

function Services() {
  const { data } = useSettings();
  const p = data?.pricing;
  return (
    <div>
      <section className="bg-warm"><div className="mx-auto max-w-6xl px-4 py-14"><h1 className="text-4xl font-semibold">Our services</h1><p className="mt-2 text-muted-foreground">Everything you need to settle in.</p></div></section>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-4">
          {services.map((s) => <div key={s.title} className="rounded-2xl bg-card p-6 shadow-soft"><s.icon className="size-7 text-primary" /><h3 className="mt-3 text-lg font-semibold">{s.title}</h3><p className="mt-2 text-sm text-muted-foreground">{s.text}</p></div>)}
        </div>
        {p && (
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-card p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-2xl"><Package className="size-5 text-primary" /> Item rates</h2>
              <ul className="mt-4 divide-y divide-border text-sm">{Object.entries(p.items).filter(([k]) => itemLabels[k]).map(([k, v]) => <li key={k} className="flex justify-between py-2"><span>{itemLabels[k]}</span><span className="font-medium">{kes(v)}</span></li>)}</ul>
            </div>
            <div className="rounded-2xl bg-card p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-2xl"><Sofa className="size-5 text-primary" /> How quotes work</h2>
              <p className="mt-4 text-sm text-muted-foreground">Transport by route + {kes(p.base_fee)} handling + items + {kes(p.per_floor)} per floor of stairs. A {p.deposit_percent}% deposit confirms your pickup. Custom locations or unusual items get a manual quote — we never guess.</p>
              <p className="mt-4 text-sm text-muted-foreground">{data?.terms.moving}</p>
              <Button asChild variant="hero" className="mt-6"><Link to="/book">Get my quote</Link></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
