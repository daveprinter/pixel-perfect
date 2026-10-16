import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bed, Building2, MessageCircle, Package, Sofa, Truck, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/useSettings";
import { waLink } from "@/lib/whatsapp";
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

const itemLabels: Record<string, string> = { bed: "Bed", mattress: "Mattress", sofa: "Sofa", gas_cylinder: "Gas cylinder", television: "Television", tv_mounting: "TV mounting", wardrobe: "Wardrobe", table_chairs: "Table & chairs", fridge: "Fridge", washing_machine: "Washing machine", kitchen: "Kitchen equipment", boxes: "Boxes (each)" };

const cards = [
  { key: "placement", icon: Building2, title: "Apartment placement", text: "We find and reserve a verified room for you, so you skip the hunt." },
  { key: "setup", icon: Bed, title: "Basic room setup", text: "Rooms pre-fitted with bed, mattress and gas cylinder." },
  { key: "moving", icon: Truck, title: "Moving services", text: "Hostel, campus and town moves with careful handling." },
  { key: "tv", icon: Tv, title: "TV mounting", text: "We mount your TV at your new home, priced separately." },
] as const;

type CardKey = (typeof cards)[number]["key"];

function Services() {
  const { data } = useSettings();
  const p = data?.pricing;
  const [open, setOpen] = useState<CardKey | null>(null);

  return (
    <div>
      <section className="bg-warm"><div className="mx-auto max-w-6xl px-4 py-14"><h1 className="text-4xl font-semibold">Our services</h1><p className="mt-2 text-muted-foreground">Everything you need to settle in. Tap a service to see details and order.</p></div></section>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-4">
          {cards.map((s) => (
            <button key={s.key} onClick={() => setOpen(s.key)} className="card-hover rounded-2xl bg-card p-6 text-left shadow-soft">
              <s.icon className="size-7 text-primary" /><h3 className="mt-3 text-lg font-semibold">{s.title}</h3><p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-primary">View details →</span>
            </button>
          ))}
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
      <ServiceDialog kind={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function ServiceDialog({ kind, onClose }: { kind: CardKey | null; onClose: () => void }) {
  const { data } = useSettings();
  const wa = data?.contacts.whatsapp;
  return (
    <Dialog open={kind !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {kind === "placement" && <PlacementForm wa={wa} />}
        {kind === "setup" && <SetupForm wa={wa} />}
        {kind === "moving" && <MovingInfo wa={wa} />}
        {kind === "tv" && <TvForm wa={wa} />}
      </DialogContent>
    </Dialog>
  );
}

function WaButton({ wa, message }: { wa?: string; message: string }) {
  if (!wa) return null;
  return <Button asChild variant="hero" className="w-full"><a href={waLink(wa, message)} target="_blank" rel="noreferrer"><MessageCircle /> Send on WhatsApp</a></Button>;
}

function PlacementForm({ wa }: { wa?: string }) {
  const [area, setArea] = useState("Kwa Vonza");
  const [type, setType] = useState("Bedsitter");
  const [budget, setBudget] = useState("");
  const [furnish, setFurnish] = useState("Vacant");
  const [date, setDate] = useState("");
  const msg = `Hi HomeShift! I'm looking for a room.\n• Area: ${area}\n• Type: ${type}\n• Furnishing: ${furnish}\n• Budget: ${budget || "flexible"} KES/month\n• Move-in date: ${date || "flexible"}`;
  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Apartment placement</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">Tell us what you're looking for and we'll match you with a verified room. You pay a reservation deposit only after we've found it.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Preferred area</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={area} onChange={(e) => setArea(e.target.value)}>{["Kwa Vonza", "SEKU", "Kitui town", "Wote town", "Other"].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div><Label>Room type</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>{["Single room", "Bedsitter", "One bedroom", "Fully vacant room"].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div><Label>Budget (KES/month)</Label><Input className="mt-1" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 6000" /></div>
        <div><Label>Furnishing</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={furnish} onChange={(e) => setFurnish(e.target.value)}>{["Vacant", "Basic (bed, mattress, gas)", "Fully furnished"].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="sm:col-span-2"><Label>Move-in date</Label><Input className="mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <WaButton wa={wa} message={msg} />
      <Button asChild variant="cream" className="w-full"><Link to="/apartments">Or browse available rooms</Link></Button>
    </div>
  );
}

function SetupForm({ wa }: { wa?: string }) {
  const [items, setItems] = useState<string[]>(["Bed", "Mattress", "Gas cylinder"]);
  const [area, setArea] = useState("");
  const toggle = (x: string) => setItems((s) => (s.includes(x) ? s.filter((i) => i !== x) : [...s, x]));
  const msg = `Hi HomeShift! I need a basic room setup.\n• Items: ${items.join(", ") || "to discuss"}\n• Location: ${area || "to discuss"}`;
  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Basic room setup</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">We deliver and set up the essentials in your new room before you arrive. Pick what you need:</p>
      <div className="flex flex-wrap gap-2">
        {["Bed", "Mattress", "Gas cylinder", "Wardrobe", "Table & chairs", "Kitchen equipment"].map((x) => (
          <button key={x} onClick={() => toggle(x)} className={`rounded-full px-3 py-1.5 text-sm ${items.includes(x) ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}>{x}</button>
        ))}
      </div>
      <div><Label>Room location</Label><Input className="mt-1" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Delta Hostel, SEKU" /></div>
      <WaButton wa={wa} message={msg} />
    </div>
  );
}

function MovingInfo({ wa }: { wa?: string }) {
  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Moving services</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">Full moves across SEKU, Kwa Vonza, Kitui and Wote. You'll pick your hostels or apartments, list your items (beds, sofas, gas cylinders, TVs, boxes — with sizes), choose a date, and get an instant quote.</p>
      <ul className="list-disc pl-5 text-sm text-muted-foreground">
        <li>Instant quote on known routes; manual quote for custom locations</li>
        <li>Stairs charged per floor — no surprises</li>
        <li>Small M-PESA deposit confirms your pickup</li>
      </ul>
      <Button asChild variant="hero" className="w-full"><Link to="/moving">See moving services & order</Link></Button>
      <WaButton wa={wa} message="Hi HomeShift! I want to book a move. Here are my details:" />
    </div>
  );
}

function TvForm({ wa }: { wa?: string }) {
  const [size, setSize] = useState('32"');
  const [mode, setMode] = useState("mount");
  const [wall, setWall] = useState("Concrete wall");
  const [bracket, setBracket] = useState("I have a bracket");
  const [where, setWhere] = useState("");
  const msg = `Hi HomeShift! I need TV ${mode === "mount" ? "mounting" : "dismounting and re-mounting"}.\n• TV size: ${size}\n• Wall: ${wall}\n• Bracket: ${bracket}\n• Location: ${where || "to discuss"}`;
  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>TV mounting</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">We mount your TV securely, or dismount it from your old place and re-mount it at the new one.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>TV size</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={size} onChange={(e) => setSize(e.target.value)}>{['24"', '32"', '43"', '50"', '55"+'].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div><Label>What do you need?</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={mode} onChange={(e) => setMode(e.target.value)}><option value="mount">Mount only</option><option value="dismount">Dismount & re-mount (moving)</option></select></div>
        <div><Label>Wall type</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={wall} onChange={(e) => setWall(e.target.value)}>{["Concrete wall", "Stone wall", "Timber / partition", "Not sure"].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div><Label>Bracket</Label><select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={bracket} onChange={(e) => setBracket(e.target.value)}>{["I have a bracket", "Need one supplied"].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="sm:col-span-2"><Label>Location</Label><Input className="mt-1" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="e.g. Amani Apartments, Kwa Vonza" /></div>
      </div>
      <WaButton wa={wa} message={msg} />
      <p className="text-xs text-muted-foreground">Moving house too? Add TV mounting inside the moving booking and it's priced with your quote.</p>
    </div>
  );
}
