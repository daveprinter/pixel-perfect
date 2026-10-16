import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MessageCircle, Phone, Youtube } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export function SiteFooter() {
  const { data } = useSettings();
  const c = data?.contacts;
  return (
    <footer className="bg-cocoa-gradient text-cocoa-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <h3 className="text-2xl">HomeShift</h3>
          <p className="mt-3 max-w-xs text-sm opacity-80">Finding homes and moving belongings across Kwa Vonza, SEKU, Kitui and Wote — without the stress.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Contact</p>
          {c?.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-2 opacity-85 hover:opacity-100"><Phone className="size-4" />{c.phone}</a>}
          {c?.whatsapp && <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 opacity-85 hover:opacity-100"><MessageCircle className="size-4" />WhatsApp us</a>}
          {c?.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 opacity-85 hover:opacity-100"><Mail className="size-4" />{c.email}</a>}
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold">Follow us</p>
          <div className="flex gap-3">
            {c?.facebook && <a href={c.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full bg-cocoa-foreground/10 p-2 hover:bg-cocoa-foreground/20"><Facebook className="size-4" /></a>}
            {c?.instagram && <a href={c.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full bg-cocoa-foreground/10 p-2 hover:bg-cocoa-foreground/20"><Instagram className="size-4" /></a>}
            {c?.youtube && <a href={c.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="rounded-full bg-cocoa-foreground/10 p-2 hover:bg-cocoa-foreground/20"><Youtube className="size-4" /></a>}
            {c?.tiktok && <a href={c.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="rounded-full bg-cocoa-foreground/10 px-3 py-2 text-xs font-bold hover:bg-cocoa-foreground/20">TikTok</a>}
          </div>
          <div className="flex gap-4 pt-2 opacity-80">
            <Link to="/apartments">Apartments</Link><Link to="/services">Services</Link><Link to="/referrals">Referrals</Link>
          </div>
        </div>
      </div>
      <p className="border-t border-cocoa-foreground/10 py-4 text-center text-xs opacity-60">© {new Date().getFullYear()} HomeShift Kenya</p>
    </footer>
  );
}
