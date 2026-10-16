import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, MessageCircle, Package, ShieldCheck, Truck, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { waLink } from "@/lib/whatsapp";
import { ITEM_TYPES, LOCATIONS } from "@/lib/quote";
import { kes } from "@/lib/format";
import movers from "@/assets/movers.jpg";

export const Route = createFileRoute("/moving")({
  head: () => ({
    meta: [
      { title: "Moving services — HomeShift" },
      { name: "description", content: "Hostel, campus and town moves across SEKU, Kwa Vonza, Kitui and Wote. Instant quotes, careful handling, TV mounting." },
      { property: "og:title", content: "Moving services — HomeShift" },
      { property: "og:description", content: "Book a move with instant quotation across Kitui and Makueni." },
    ],
  }),
  component: Moving,
});

const steps = [
  { t: "Tell us your route", d: "Pick where you're moving from and to — SEKU hostels, KU Kwa Vonza, Kwa Vonza town, Kitui or Wote." },
  { t: "List your items", d: "Beds, mattresses, sofas, gas cylinders, TVs and boxes — with sizes so we send the right vehicle." },
  { t: "Get an instant quote", d: "Known routes price immediately. Unusual locations or items get a careful manual quote — we never guess." },
  { t: "Pay a deposit to confirm", d: "A small M-PESA deposit locks your date. The balance is due on moving day." },
];

const promises = [
  "Careful wrapping and handling of fragile items",
  "Stairs? We carry up and down — priced per floor",
  "TV dismounting and re-mounting at your new place",
  "Same-day slots for hostel moves when available",
];

function Moving() {
  const { data } = useSettings();
  const p = data?.pricing;
  const wa = data?.contacts.whatsapp;

  return (
    <div>
      <section className="bg-warm">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-semibold md:text-5xl">Moving services, done properly</h1>
            <p className="mt-4 text-lg text-muted-foreground">Hostel, campus and town moves across SEKU, Kwa Vonza, Kitui and Wote — with instant quotes and careful hands.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl"><Link to="/book">Order a new moving service <ArrowRight /></Link></Button>
              {wa && <Button asChild variant="cream" size="xl"><a href={waLink(wa, "Hi HomeShift! I'd like to ask about your moving services.")} target="_blank" rel="noreferrer"><MessageCircle /> Ask on WhatsApp</a></Button>}
            </div>
          </div>
          <img src={movers} alt="Movers carrying boxes" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-semibold">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.t} className="rounded-2xl bg-card p-6 shadow-soft">
              <span className="grid size-9 place-items-center rounded-full bg-gradient-primary font-bold text-primary-foreground">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-6 shadow-soft">
            <h2 className="flex items-center gap-2 text-2xl"><Truck className="size-6 text-primary" /> Routes we cover</h2>
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {LOCATIONS.filter((l) => l.value !== "Other").map((l) => <li key={l.value} className="flex items-center gap-2"><Check className="size-4 text-success" />{l.label}</li>)}
              <li className="flex items-center gap-2 text-muted-foreground"><Check className="size-4" />Other locations — manual quote</li>
            </ul>
            {p && (
              <div className="mt-6 rounded-xl bg-secondary/60 p-4 text-sm">
                <p className="font-semibold">Transparent pricing</p>
                <p className="mt-1 text-muted-foreground">Route transport + {kes(p.base_fee)} handling + your items + {kes(p.per_floor)} per floor of stairs. A {p.deposit_percent}% deposit confirms your pickup.</p>
              </div>
            )}
          </div>
          <div className="rounded-2xl bg-card p-6 shadow-soft">
            <h2 className="flex items-center gap-2 text-2xl"><Package className="size-6 text-primary" /> What we move</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {ITEM_TYPES.filter((t) => t.key !== "other").map((t) => <li key={t.key} className="rounded-full bg-secondary px-3 py-1.5 text-sm">{t.label}</li>)}
            </ul>
            <div className="mt-6 rounded-xl bg-secondary/60 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold"><Tv className="size-4 text-primary" /> TV mounting & dismounting</p>
              <p className="mt-1 text-muted-foreground">We safely dismount your TV at pickup and mount it at the destination — wall brackets handled, priced separately.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl bg-cocoa-gradient p-8 text-primary-foreground shadow-lift md:p-12">
          <h2 className="flex items-center gap-2 text-3xl font-semibold"><ShieldCheck className="size-7" /> Our promise</h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {promises.map((x) => <li key={x} className="flex items-start gap-2"><Check className="mt-0.5 size-5 shrink-0" />{x}</li>)}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="cream" size="xl"><Link to="/book">Order a new moving service</Link></Button>
            {wa && <Button asChild variant="outline" size="xl" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"><a href={waLink(wa, "Hi HomeShift! I want to book a move. Here are my details:")} target="_blank" rel="noreferrer"><MessageCircle /> Chat on WhatsApp</a></Button>}
          </div>
        </div>
      </section>
    </div>
  );
}
