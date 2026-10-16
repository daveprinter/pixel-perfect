import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Contacts { phone: string; whatsapp: string; email: string; facebook: string; instagram: string; tiktok: string; youtube: string; website: string }
export interface Terms { moving: string; placement: string; referral: string }
export interface ReferralRules { bonus_amount: number; payout_threshold: number; qualifying: string[] }

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key,value");
      if (error) throw error;
      const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, unknown>;
      return {
        pricing: map.pricing as import("@/lib/quote").PricingRules,
        terms: map.terms as Terms,
        referral: map.referral as ReferralRules,
        contacts: map.contacts as Contacts,
      };
    },
  });
}
