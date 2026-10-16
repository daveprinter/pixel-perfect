import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & support — HomeShift" },
      { name: "description", content: "Call, WhatsApp or message HomeShift for rooms, quotes and booking help." },
      { property: "og:title", content: "Contact HomeShift" },
      { property: "og:description", content: "Call, WhatsApp or send us a message." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data } = useSettings();
  const { user } = useAuth();
  const c = data?.contacts;
  const [topic, setTopic] = useState("question");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!user) return;
    if (subject.trim().length < 3 || body.trim().length < 5) return toast.error("Add a subject and message");
    setBusy(true);
    const { error } = await supabase.from("support_messages").insert({ user_id: user.id, topic, subject: subject.slice(0, 150), body: body.slice(0, 2000) });
    setBusy(false);
    if (error) return toast.error("Could not send");
    toast.success("Message sent. See replies in your account.");
    setSubject(""); setBody("");
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-semibold">We're here to help</h1>
        <p className="mt-3 text-muted-foreground">Questions about a room, a quotation or your booking? Reach us any way you like.</p>
        <div className="mt-8 flex flex-col gap-3">
          {c?.whatsapp && <Button asChild variant="hero" size="xl" className="w-fit"><a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /> Chat on WhatsApp</a></Button>}
          {c?.phone && <Button asChild variant="cream" size="xl" className="w-fit"><a href={`tel:${c.phone}`}><Phone /> Call {c.phone}</a></Button>}
          {c?.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-4" />{c.email}</a>}
        </div>
      </div>
      <div className="rounded-3xl bg-card p-6 shadow-lift">
        <h2 className="text-2xl">Send a message</h2>
        {user ? (
          <div className="mt-4 space-y-3">
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="question">General question</option>
              <option value="apartment">Apartment details</option>
              <option value="quotation">Quotation request</option>
              <option value="booking">Booking help</option>
              <option value="complaint">Complaint</option>
            </select>
            <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Textarea rows={5} placeholder="How can we help?" value={body} onChange={(e) => setBody(e.target.value)} />
            <Button variant="hero" disabled={busy} onClick={send}>Send message</Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground"><Link to="/auth" className="font-semibold text-primary">Sign in</Link> to send a message and track replies.</p>
        )}
      </div>
    </div>
  );
}
