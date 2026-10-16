import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function audit(action: string, details: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getUser();
  if (data.user) await supabase.from("audit_log").insert({ actor_id: data.user.id, action, details: details as never });
}

export function useAdminData() {
  return useQuery({
    queryKey: ["admin-data"],
    queryFn: async () => {
      const [profiles, bookings, placements, payments, expenses, rewards, payouts, listings, costs, messages, ads] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("placement_requests").select("*, listings(name, location, service_fee, customer_price)").order("created_at", { ascending: false }),
        supabase.from("payments").select("*, bookings(reference)").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").order("spent_on", { ascending: false }),
        supabase.from("referral_rewards").select("*").order("created_at", { ascending: false }),
        supabase.from("referral_payouts").select("*").order("created_at", { ascending: false }),
        supabase.from("listings").select("*").order("created_at", { ascending: false }),
        supabase.from("listing_costs").select("*"),
        supabase.from("support_messages").select("*, message_replies(*)").order("created_at", { ascending: false }),
        supabase.from("ad_campaigns").select("*").order("created_at", { ascending: false }),
      ]);
      const err = [profiles, bookings, placements, payments, expenses, rewards, payouts, listings, costs, messages, ads].find((r) => r.error);
      if (err?.error) throw err.error;
      return {
        profiles: profiles.data!, bookings: bookings.data!, placements: placements.data!, payments: payments.data!, expenses: expenses.data!,
        rewards: rewards.data!, payouts: payouts.data!, listings: listings.data!, costs: costs.data!, messages: messages.data!, ads: ads.data!,
      };
    },
  });
}
export type AdminData = NonNullable<ReturnType<typeof useAdminData>["data"]>;

export function useRefresh() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: ["admin-data"] }); qc.invalidateQueries({ queryKey: ["settings"] }); qc.invalidateQueries({ queryKey: ["places"] }); };
}

export function nameOf(d: AdminData, id: string) {
  const p = d.profiles.find((x) => x.id === id);
  return p?.full_name || p?.phone || id.slice(0, 6);
}

export function Card({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft">
      {(title || action) && <div className="mb-3 flex items-center justify-between gap-2">{title && <h3 className="text-lg font-semibold">{title}</h3>}{action}</div>}
      {children}
    </div>
  );
}

export const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";
