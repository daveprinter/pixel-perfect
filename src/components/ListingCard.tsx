import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { kes, nice } from "@/lib/format";
import building from "@/assets/building.jpg";
import room from "@/assets/single-room.jpg";
import hero from "@/assets/hero-room.jpg";
import type { Tables } from "@/integrations/supabase/types";

export type Listing = Tables<"listings">;

const fallbacks = [room, building, hero];
export function fallbackPhoto(l: Pick<Listing, "id" | "furnishing">) {
  if (l.furnishing === "basic") return room;
  return fallbacks[l.id.charCodeAt(0) % fallbacks.length];
}

export function usePhotoUrls(paths: string[]) {
  return useQuery({
    queryKey: ["photo-urls", paths],
    enabled: paths.length > 0,
    queryFn: async () => {
      const { data } = await supabase.storage.from("listing-photos").createSignedUrls(paths, 3600);
      return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
    },
  });
}

export function ListingCard({ l }: { l: Listing }) {
  const { data: urls } = usePhotoUrls(l.photos.slice(0, 1));
  const src = urls?.[0] ?? fallbackPhoto(l);
  return (
    <Link to="/apartments/$id" params={{ id: l.id }} className="card-hover group block overflow-hidden rounded-2xl bg-card shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={src} alt={l.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold">{l.accommodation_type}</span>
        {l.is_sample && <span className="absolute right-3 top-3 rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">Sample</span>}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold">{l.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{l.location}{l.door_number ? ` · Door ${l.door_number}` : ""}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-primary">{kes(l.customer_price)}<span className="text-xs font-normal text-muted-foreground"> /month</span></p>
            <p className="text-xs text-muted-foreground">{nice(l.furnishing)} furnishing</p>
          </div>
          <span className="text-sm font-semibold text-primary group-hover:underline">View →</span>
        </div>
      </div>
    </Link>
  );
}
