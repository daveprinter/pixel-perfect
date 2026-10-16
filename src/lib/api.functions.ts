import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calculateQuote, type PricingRules } from "./quote";

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const itemSchema = z.object({
  key: z.string().max(40),
  qty: z.number().int().min(0).max(100),
  size: z.string().max(40).optional(),
  note: z.string().max(300).optional(),
});

const bookingSchema = z.object({
  origin: z.string().min(1).max(60),
  originDetail: z.string().max(200).optional(),
  destination: z.string().min(1).max(60),
  destinationDetail: z.string().max(200).optional(),
  items: z.array(itemSchema).max(40),
  tvMounting: z.boolean(),
  floorLevel: z.number().int().min(0).max(30),
  specialHandling: z.string().max(500).optional(),
  moveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  moveTime: z.string().max(20).optional(),
  phone: z.string().regex(/^\+?[0-9 ]{9,15}$/, "Enter a valid phone number"),
  notes: z.string().max(1000).optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bookingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: s, error } = await context.supabase.from("app_settings").select("value").eq("key", "pricing").single();
    if (error || !s) throw new Error("Pricing unavailable");
    const quote = calculateQuote(s.value as unknown as PricingRules, data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: e2 } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: context.userId,
        origin: data.origin,
        origin_detail: data.originDetail,
        destination: data.destination,
        destination_detail: data.destinationDetail,
        items: [...data.items, ...(data.tvMounting ? [{ key: "tv_mounting", qty: 1 }] : [])],
        floor_level: data.floorLevel,
        special_handling: data.specialHandling,
        move_date: data.moveDate,
        move_time: data.moveTime,
        phone: data.phone,
        notes: data.notes,
        quote_breakdown: quote.lines as never,
        quote_total: quote.total,
        deposit_required: quote.deposit,
        needs_manual_quote: quote.needsManual,
        status: quote.needsManual ? "awaiting_quotation" : "awaiting_deposit",
      })
      .select("id, reference")
      .single();
    if (e2 || !row) throw new Error("Could not save booking");
    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId,
      title: `Booking ${row.reference} received`,
      body: quote.needsManual ? "We'll send your quotation shortly." : "Pay the deposit to confirm your pickup.",
    });
    return row;
  });

export const submitPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      bookingId: z.string().uuid(),
      method: z.enum(["mpesa", "bank", "cash"]),
      providerRef: z.string().trim().min(6).max(40),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: b } = await context.supabase
      .from("bookings")
      .select("id, user_id, status, deposit_required")
      .eq("id", data.bookingId)
      .single();
    if (!b || b.user_id !== context.userId) throw new Error("Booking not found");
    if (b.status !== "awaiting_deposit" || !b.deposit_required) throw new Error("This booking is not awaiting a deposit");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dup } = await supabaseAdmin.from("payments").select("id").eq("booking_id", b.id).eq("status", "pending").maybeSingle();
    if (dup) throw new Error("A payment is already awaiting verification for this booking");
    // Recorded as pending only. It is marked verified after the provider callback
    // or an administrator confirms the transaction — never automatically here.
    const { error } = await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      booking_id: b.id,
      kind: "deposit",
      amount: b.deposit_required,
      method: data.method,
      provider_ref: data.providerRef.toUpperCase(),
      status: "pending",
    });
    if (error) throw new Error("Could not record payment");
    return { ok: true };
  });

export const redeemAdminCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(4).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    const hash = await sha256(data.code.trim());
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("admin_setup_codes")
      .select("id")
      .eq("code_hash", hash)
      .eq("revoked", false)
      .is("used_by", null)
      .maybeSingle();
    if (!row) throw new Error("Invalid, used or revoked code");
    await supabaseAdmin.from("admin_setup_codes").update({ used_by: context.userId, used_at: new Date().toISOString() }).eq("id", row.id);
    await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, action: "admin_code_redeemed", details: { code_id: row.id } });
    return { ok: true };
  });

async function assertAdmin(supabase: { rpc: (fn: "is_admin") => PromiseLike<{ data: unknown }> }) {
  const { data } = await supabase.rpc("is_admin");
  if (data !== true) throw new Error("Not authorized");
}

export const listAdminCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("admin_setup_codes").select("id,label,revoked,used_by,used_at,created_at").order("created_at");
    return data ?? [];
  });

export const manageAdminCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.union([
      z.object({ action: z.literal("revoke"), id: z.string().uuid() }),
      z.object({ action: z.literal("create"), label: z.string().min(1).max(60), code: z.string().min(8).max(100) }),
    ]).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "revoke") {
      await supabaseAdmin.from("admin_setup_codes").update({ revoked: true }).eq("id", data.id);
    } else {
      const { error } = await supabaseAdmin.from("admin_setup_codes").insert({ label: data.label, code_hash: await sha256(data.code.trim()) });
      if (error) throw new Error("Could not create code");
    }
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, action: `admin_code_${data.action}`, details: data.action === "revoke" ? { id: data.id } : { label: data.label } });
    return { ok: true };
  });
