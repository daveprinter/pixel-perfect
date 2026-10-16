import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, ShieldCheck, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { kes } from "@/lib/format";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Refer & earn cash — HomeShift" },
      { name: "description", content: "Share your referral link and earn a cash bonus when friends complete a paid service." },
      { property: "og:title", content: "Refer friends, earn cash — HomeShift" },
      { property: "og:description", content: "Earn a cash bonus for every friend who completes a paid service." },
    ],
  }),
  component: Referrals,
});

function Referrals() {
  const { data } = useSettings();
  const r = data?.referral;
  const items = [
    { icon: Users, t: "Share your link", d: "Every account gets a unique code and link." },
    { icon: ShieldCheck, t: "Friend completes a paid service", d: "Moving or placement, fully paid and completed." },
    { icon: Gift, t: `Earn ${kes(r?.bonus_amount)}`, d: "Reviewed and approved by our team." },
    { icon: Wallet, t: "Get paid", d: `Withdraw once you reach ${kes(r?.payout_threshold)}.` },
  ];
  return (
    <div>
      <section className="bg-warm"><div className="mx-auto max-w-4xl px-4 py-16 text-center"><h1 className="text-4xl font-semibold md:text-5xl">Refer friends. <span className="text-primary">Earn real cash.</span></h1><p className="mt-4 text-muted-foreground">Help a friend find a home or move — and get rewarded.</p><Button asChild variant="hero" size="xl" className="mt-8"><Link to="/dashboard">Get my referral link</Link></Button></div></section>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-4">{items.map((i) => <div key={i.t} className="rounded-2xl bg-card p-6 shadow-soft"><i.icon className="size-7 text-primary" /><h3 className="mt-3 font-semibold">{i.t}</h3><p className="mt-1 text-sm text-muted-foreground">{i.d}</p></div>)}</div>
      <div className="mx-auto max-w-3xl px-4 pb-16"><h2 className="text-2xl">Eligibility & payout rules</h2><p className="mt-3 text-sm text-muted-foreground">{data?.terms.referral}</p></div>
    </div>
  );
}
