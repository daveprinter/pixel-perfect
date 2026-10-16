import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { createBooking } from "@/lib/api.functions";
import { calculateQuote, ITEM_TYPES, LOCATIONS, type BookingItem } from "@/lib/quote";
import { kes } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/book")({
  head: () => ({ meta: [{ title: "Book a move — HomeShift" }, { name: "description", content: "Step-by-step moving booking with instant quotation." }, { property: "og:title", content: "Book a move — HomeShift" }, { property: "og:description", content: "Get an instant moving quotation." }] }),
  component: Book,
});

const STEPS = ["Origin", "Destination", "Items", "Date & contact", "Review"];

interface Place { loc: string; place: string; custom: string; door: string; address: string }
const emptyPlace: Place = { loc: "", place: "", custom: "", door: "", address: "" };

function placeKind(loc: string) {
  if (loc === "SEKU") return "seku";
  if (loc === "Kwa Vonza (KU)" || loc === "Kwa Vonza town") return "kwavonza";
  return null;
}

function describe(p: Place) {
  const name = p.place === "Other" ? p.custom : p.place;
  return [name, p.door && `Room/Door ${p.door}`, p.address].filter(Boolean).join(", ");
}

function PlacePicker({ value, onChange, showList }: { value: Place; onChange: (p: Place) => void; showList: boolean }) {
  const kind = placeKind(value.loc);
  const { data: opts } = useQuery({
    queryKey: ["places"],
    queryFn: async () => (await supabase.from("place_options").select("*").eq("active", true).order("sort")).data ?? [],
  });
  const list = (opts ?? []).filter((o) => o.kind === kind);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {LOCATIONS.map((l) => (
          <button key={l.value} type="button" onClick={() => onChange({ ...emptyPlace, loc: l.value })}
            className={`flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${value.loc === l.value ? "border-primary bg-accent/50" : "border-border bg-card hover:border-primary/50"}`}>
            <span className="font-medium">{l.label}</span>{value.loc === l.value && <Check className="size-4 text-primary" />}
          </button>
        ))}
      </div>
      {showList && kind && (
        <div>
          <Label>{kind === "seku" ? "SEKU hostel" : "Kwa Vonza apartment"}</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...list.map((o) => o.name), "Other"].map((n) => (
              <button key={n} type="button" onClick={() => onChange({ ...value, place: n })} className={`rounded-full px-3 py-1.5 text-sm ${value.place === n ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}>{n}</button>
            ))}
          </div>
          {value.place === "Other" && <Input className="mt-3" placeholder={kind === "seku" ? "Hostel name" : "Apartment name"} value={value.custom} onChange={(e) => onChange({ ...value, custom: e.target.value })} />}
          {value.place && <Input className="mt-3" placeholder="Room or door number" value={value.door} onChange={(e) => onChange({ ...value, door: e.target.value })} />}
        </div>
      )}
      {value.loc && (
        <div><Label>Exact building, hostel or address {kind && showList ? "(optional)" : ""}</Label><Input className="mt-1" value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} placeholder="e.g. Near the stage, blue gate" /></div>
      )}
    </div>
  );
}

function Book() {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const [step, setStep] = useState(0);
  const [origin, setOrigin] = useState<Place>(emptyPlace);
  const [dest, setDest] = useState<Place>(emptyPlace);
  const [items, setItems] = useState<Record<string, BookingItem>>({});
  const [tvMount, setTvMount] = useState(false);
  const [floor, setFloor] = useState(0);
  const [handling, setHandling] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [moveTime, setMoveTime] = useState("09:00");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const itemList = Object.values(items).filter((i) => i.qty > 0);
  const quote = useMemo(() => settings ? calculateQuote(settings.pricing, { origin: origin.loc, destination: dest.loc, items: itemList, tvMounting: tvMount, floorLevel: floor }) : null, [settings, origin.loc, dest.loc, itemList, tvMount, floor]);

  const setQty = (key: string, delta: number) => setItems((s) => ({ ...s, [key]: { ...(s[key] ?? { key, qty: 0 }), qty: Math.max(0, (s[key]?.qty ?? 0) + delta) } }));
  const setField = (key: string, f: Partial<BookingItem>) => setItems((s) => ({ ...s, [key]: { ...(s[key] ?? { key, qty: 1 }), ...f } }));
  const hasTv = (items.television?.qty ?? 0) > 0;

  const today = new Date().toISOString().slice(0, 10);
  const canNext = [
    !!origin.loc && (origin.loc !== "Other" || origin.address.length > 2),
    !!dest.loc && (dest.loc !== "Other" || dest.address.length > 2) && (dest.place !== "Other" || dest.custom.length > 1),
    itemList.length > 0 && (items.other?.qty ? !!items.other.note : true),
    !!moveDate && moveDate >= today && /^\+?[0-9 ]{9,15}$/.test(phone),
    true,
  ][step];

  const submit = async () => {
    setBusy(true);
    try {
      const res = await createBooking({ data: {
        origin: origin.loc, originDetail: describe(origin), destination: dest.loc, destinationDetail: describe(dest),
        items: itemList, tvMounting: hasTv && tvMount, floorLevel: floor, specialHandling: handling,
        moveDate, moveTime, phone, notes,
      } });
      toast.success(`Booking ${res.reference} created`);
      navigate({ to: quote?.needsManual ? "/dashboard" : "/pay/$bookingId", params: { bookingId: res.id } });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="bg-warm min-h-[80vh]">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold md:text-4xl">Book your move</h1>
        <ol className="mt-6 flex gap-2 overflow-x-auto">
          {STEPS.map((s, i) => <li key={s} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-card text-success" : "bg-card/60 text-muted-foreground"}`}>{i < step ? <Check className="size-3" /> : i + 1}. {s}</li>)}
        </ol>
        <div className="mt-6 rounded-3xl bg-card p-6 shadow-lift md:p-8">
          {step === 0 && <><h2 className="mb-4 text-xl">Where are we picking up?</h2><PlacePicker value={origin} onChange={setOrigin} showList /></>}
          {step === 1 && <><h2 className="mb-4 text-xl">Where are you moving to?</h2><PlacePicker value={dest} onChange={setDest} showList /></>}
          {step === 2 && (
            <div className="space-y-3">
              <h2 className="mb-2 text-xl">What are we moving?</h2>
              {ITEM_TYPES.map((t) => {
                const it = items[t.key];
                return (
                  <div key={t.key} className={`rounded-xl border p-3 ${it?.qty ? "border-primary bg-accent/30" : "border-border"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{t.label}</span>
                      <div className="flex items-center gap-2">
                        <Button type="button" size="icon" variant="outline" onClick={() => setQty(t.key, -1)}><Minus /></Button>
                        <span className="w-6 text-center font-semibold">{it?.qty ?? 0}</span>
                        <Button type="button" size="icon" variant="outline" onClick={() => setQty(t.key, 1)}><Plus /></Button>
                      </div>
                    </div>
                    {!!it?.qty && (t.sizes.length > 0 || t.key === "other") && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {t.sizes.map((s) => <button key={s} type="button" onClick={() => setField(t.key, { size: it.size === s ? undefined : s })} className={`rounded-full px-3 py-1 text-xs ${it.size === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{s}</button>)}
                        {t.key === "other" && <Input placeholder="Describe the item(s)" value={it.note ?? ""} onChange={(e) => setField(t.key, { note: e.target.value })} />}
                      </div>
                    )}
                    {t.key === "television" && !!it?.qty && (
                      <label className="mt-3 flex items-center gap-2 text-sm"><Checkbox checked={tvMount} onCheckedChange={(v) => setTvMount(v === true)} /> Do you need TV mounting at the destination? (priced separately)</label>
                    )}
                  </div>
                );
              })}
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div><Label>Floors of stairs (total)</Label><Input type="number" min={0} max={30} value={floor} onChange={(e) => setFloor(Number(e.target.value))} /></div>
                <div><Label>Special handling</Label><Input value={handling} onChange={(e) => setHandling(e.target.value)} placeholder="Fragile glass, heavy items…" /></div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl">When and how do we reach you?</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Moving date</Label><Input type="date" min={today} value={moveDate} onChange={(e) => setMoveDate(e.target.value)} /></div>
                <div><Label>Preferred time</Label><Input type="time" value={moveTime} onChange={(e) => setMoveTime(e.target.value)} /></div>
              </div>
              <div><Label>Phone number</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" /></div>
              <div><Label>Additional instructions</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </div>
          )}
          {step === 4 && quote && (
            <div className="space-y-4">
              <h2 className="text-xl">Review & quotation</h2>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="text-muted-foreground">From:</span> {origin.loc} {describe(origin) && `— ${describe(origin)}`}</p>
                <p><span className="text-muted-foreground">To:</span> {dest.loc} {describe(dest) && `— ${describe(dest)}`}</p>
                <p><span className="text-muted-foreground">Date:</span> {moveDate} at {moveTime}</p>
                <p><span className="text-muted-foreground">Phone:</span> {phone}</p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
                {quote.lines.map((l) => <div key={l.label} className="flex justify-between py-1"><span>{l.label}</span><span>{kes(l.amount)}</span></div>)}
                {quote.needsManual ? (
                  <div className="mt-3 rounded-xl bg-warning/30 p-3"><p className="font-semibold">Pending approval</p><ul className="list-disc pl-5 text-xs">{quote.reasons.map((r) => <li key={r}>{r}</li>)}</ul><p className="mt-1 text-xs">We'll send your final quotation before you pay anything.</p></div>
                ) : (
                  <>
                    <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold"><span>Estimated total</span><span>{kes(quote.total)}</span></div>
                    <div className="flex justify-between text-primary"><span>Deposit to confirm ({settings?.pricing.deposit_percent}%)</span><span className="font-semibold">{kes(quote.deposit)}</span></div>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{settings?.terms.moving}</p>
            </div>
          )}
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft /> Back</Button>
            {step < 4 ? <Button variant="hero" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue <ChevronRight /></Button>
              : <Button variant="hero" disabled={busy} onClick={submit}>{quote?.needsManual ? "Submit for quotation" : "Confirm & pay deposit"}</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
