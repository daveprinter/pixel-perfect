import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/apartments/")({
  head: () => ({
    meta: [
      { title: "Apartments & rooms — HomeShift" },
      { name: "description", content: "Browse available bedsitters, single rooms and furnished rooms in Kwa Vonza, Kitui and Wote." },
      { property: "og:title", content: "Available apartments & rooms — HomeShift" },
      { property: "og:description", content: "Bedsitters, single rooms and furnished rooms ready to move in." },
    ],
  }),
  component: Apartments,
});

const TYPES = ["All", "Bedsitter", "Single room", "Fully vacant room", "One bedroom"];

function Apartments() {
  const [type, setType] = useState("All");
  const [furnished, setFurnished] = useState("all");
  const { data, isLoading } = useQuery({
    queryKey: ["listings", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("status", "available").order("customer_price");
      if (error) throw error;
      return data;
    },
  });
  const list = (data ?? []).filter((l) => (type === "All" || l.accommodation_type === type) && (furnished === "all" || l.furnishing === furnished));

  return (
    <div>
      <section className="bg-warm">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="text-4xl font-semibold">Find an apartment</h1>
          <p className="mt-2 text-muted-foreground">Only rooms that are actually available right now.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${type === t ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-secondary"}`}>{t}</button>
            ))}
            <select value={furnished} onChange={(e) => setFurnished(e.target.value)} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm">
              <option value="all">Any furnishing</option>
              <option value="vacant">Vacant</option>
              <option value="basic">Basic (bed, mattress, gas)</option>
              <option value="furnished">Fully furnished</option>
            </select>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-12">
        {isLoading ? <p className="text-muted-foreground">Loading rooms…</p> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((l) => <ListingCard key={l.id} l={l} />)}
            {list.length === 0 && <p className="text-muted-foreground">No rooms match these filters right now.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
