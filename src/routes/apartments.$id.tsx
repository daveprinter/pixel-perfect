import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { fallbackPhoto, usePhotoUrls } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { kes, nice } from "@/lib/format";

export const Route = createFileRoute("/apartments/$id")({
  head: () => ({
    meta: [
      { title: "Room details — HomeShift" },
      { name: "description", content: "Room details, deposits and how to request placement." },
      { property: "og:title", content: "Room details — HomeShift" },
      { property: "og:description", content: "See pricing, deposits and request this room." },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const [msg, setMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: l, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });
  const { data: urls } = usePhotoUrls(l?.photos ?? []);

  if (isLoading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (!l) return <div className="p-16 text-center"><h1 className="text-2xl">This room is no longer available</h1><Link to="/apartments" className="mt-4 inline-block text-primary">Browse other rooms</Link></div>;

  const photos = urls?.length ? urls : [fallbackPhoto(l)];
  const upfront = Number(l.reservation_amount) + Number(l.landlord_deposit) + Number(l.service_fee);

  const request = async () => {
    if (!user) return navigate({ to: "/auth", search: { redirect: `/apartments/${id}` } });
    if (!/^\+?[0-9 ]{9,15}$/.test(phone)) return toast.error("Enter a valid phone number");
    setBusy(true);
    const { error } = await supabase.from("placement_requests").insert({ user_id: user.id, listing_id: l.id, phone, message: msg.slice(0, 1000) });
    setBusy(false);
    if (error) return toast.error("Could not send request");
    toast.success("Request sent! We'll contact you to confirm.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <img src={photos[0]} alt={l.name} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-soft" />
          {photos.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3">{photos.slice(1, 5).map((p) => <img key={p} src={p} alt="" loading="lazy" className="aspect-square rounded-xl object-cover" />)}</div>}
          <h1 className="mt-6 text-3xl font-semibold">{l.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground"><MapPin className="size-4" />{l.location}{l.door_number ? ` · Door ${l.door_number}` : ""}</p>
          {l.is_sample && <p className="mt-2 inline-block rounded-full bg-warning px-3 py-0.5 text-xs font-bold text-warning-foreground">Sample listing</p>}
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-card p-4 shadow-soft"><p className="text-muted-foreground">Type</p><p className="font-semibold">{l.accommodation_type}</p></div>
            <div className="rounded-xl bg-card p-4 shadow-soft"><p className="text-muted-foreground">Furnishing</p><p className="font-semibold">{nice(l.furnishing)}</p></div>
          </div>
          {l.household_items.length > 0 && (
            <div className="mt-6"><h3 className="font-semibold">Included items</h3><ul className="mt-2 flex flex-wrap gap-2">{l.household_items.map((i) => <li key={i} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"><Check className="size-3.5 text-success" />{i}</li>)}</ul></div>
          )}
          {l.description && <p className="mt-6 text-muted-foreground">{l.description}</p>}
        </div>
        <aside className="h-fit space-y-4 rounded-3xl bg-card p-6 shadow-lift lg:sticky lg:top-24">
          <p className="text-3xl font-bold text-primary">{kes(l.customer_price)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
          <div className="space-y-2 rounded-2xl bg-secondary/60 p-4 text-sm">
            <Row label="Reservation deposit" hint="Holds the room; credited to rent" v={l.reservation_amount} />
            <Row label="Landlord deposit (refundable)" hint="Refunded by the landlord at move-out" v={l.landlord_deposit} />
            <Row label="Company service fee" hint="Covers sourcing & setup" v={l.service_fee} />
            <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Due before move-in</span><span>{kes(upfront)}</span></div>
          </div>
          <p className="text-xs text-muted-foreground">{settings?.terms.placement}</p>
          <Input placeholder="Phone number e.g. 0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Textarea placeholder="Move-in date, questions…" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <Button variant="hero" size="xl" className="w-full" disabled={busy} onClick={request}>{user ? "Request this room" : "Sign in to request"}</Button>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, hint, v }: { label: string; hint: string; v: number }) {
  return <div className="flex justify-between gap-2"><div><p>{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div><span className="font-medium">{kes(v)}</span></div>;
}
