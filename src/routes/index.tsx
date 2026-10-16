import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Home, KeyRound, Quote, Search, ShieldCheck, Truck, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero-room.jpg";
import movers from "@/assets/movers.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HomeShift — Find a home & move without stress in Kitui County" },
      { name: "description", content: "Rooms, bedsitters and hostels in Kwa Vonza, SEKU, Kitui and Wote — plus on-demand moving with instant quotes." },
      { property: "og:title", content: "HomeShift — Find a home & move without stress" },
      { property: "og:description", content: "Rooms, bedsitters and on-demand moving across Kwa Vonza, SEKU, Kitui and Wote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: Search, title: "Tell us what you need", text: "Browse rooms or describe your move — origin, destination and items." },
  { icon: KeyRound, title: "We secure it", text: "We reserve your room with the landlord or schedule your movers." },
  { icon: ShieldCheck, title: "Pay a small deposit", text: "Clear breakdown, verified payment, and a receipt in your account." },
  { icon: Truck, title: "Move in, stress-free", text: "Our team carries, transports and even mounts your TV." },
];

const testimonials = [
  { name: "Faith M.", role: "SEKU student", text: "They found me a bedsitter in Kwa Vonza and moved my stuff from Elementaita the same day." },
  { name: "Brian K.", role: "Teacher, Kitui", text: "Clear quote, no surprises. The movers handled my fridge and TV like their own." },
  { name: "Mercy W.", role: "KU student", text: "I earned a referral bonus after my roommate booked. Genuinely paid out!" },
];

function Index() {
  const { data: listings } = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("status", "available").order("created_at", { ascending: false }).limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <section className="bg-warm">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 text-xs font-semibold text-accent-foreground"><Home className="size-3.5" /> Kwa Vonza · SEKU · Kitui · Wote</span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">Find your next home. <span className="text-primary">Move without the stress.</span></h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">We secure rooms, set up the basics and carry everything you own — from hostel to bedsitter, campus to town.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl"><Link to="/apartments">Find an Apartment <ArrowRight /></Link></Button>
              <Button asChild variant="cocoa" size="xl"><Link to="/book">Book Moving Services</Link></Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="cream" size="lg"><Link to="/services">View Services</Link></Button>
              <Button asChild variant="ghost" size="lg"><Link to="/auth">Get Started</Link></Button>
            </div>
          </div>
          <div className="relative fade-up">
            <img src={hero} alt="Cosy furnished bedsitter" width={1600} height={1104} className="rounded-3xl object-cover shadow-lift" />
            <div className="absolute -bottom-6 -left-4 rounded-2xl bg-card p-4 shadow-soft md:-left-8">
              <p className="flex items-center gap-2 text-sm font-semibold"><BadgeCheck className="size-4 text-success" /> Only truly available rooms</p>
              <p className="text-xs text-muted-foreground">Verified listings, clear deposits</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold md:text-4xl">Featured accommodation</h2>
            <p className="mt-2 text-muted-foreground">Bedsitters, single rooms and furnished options ready for you.</p>
          </div>
          <Link to="/apartments" className="hidden text-sm font-semibold text-primary md:block">See all →</Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings?.map((l) => <ListingCard key={l.id} l={l} />)}
          {listings && listings.length === 0 && <p className="text-muted-foreground">New rooms are coming soon.</p>}
        </div>
      </section>

      <section className="bg-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><s.icon className="size-5" /></span>
                  <span className="font-display text-3xl text-border">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
        <img src={movers} alt="Movers carrying a sofa" loading="lazy" width={1408} height={1008} className="rounded-3xl shadow-lift" />
        <div>
          <h2 className="text-3xl font-semibold md:text-4xl">Moving made simple</h2>
          <p className="mt-4 text-muted-foreground">Pick your origin and destination, tick your items, and get an instant quotation. Beds, mattresses, sofas, fridges, gas cylinders — we've got it.</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3"><Truck className="size-5 text-primary" /> Campus to town, hostel to apartment</li>
            <li className="flex gap-3"><Tv className="size-5 text-primary" /> Optional TV mounting at your new place</li>
            <li className="flex gap-3"><ShieldCheck className="size-5 text-primary" /> Deposit confirms your pickup, balance on completion</li>
          </ul>
          <Button asChild variant="hero" size="xl" className="mt-8"><Link to="/book">Get a moving quote</Link></Button>
        </div>
      </section>

      <section className="bg-warm">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">What our customers say</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl bg-card p-6 shadow-soft">
                <Quote className="size-6 text-primary" />
                <blockquote className="mt-3 text-sm">{t.text}</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{t.name} <span className="font-normal text-muted-foreground">· {t.role}</span></figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Sample testimonials</p>
        </div>
      </section>
    </>
  );
}
