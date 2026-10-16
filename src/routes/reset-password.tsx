import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set a new password — HomeShift" }, { name: "description", content: "Choose a new password." }, { property: "og:title", content: "Reset password — HomeShift" }, { property: "og:description", content: "Choose a new password." }] }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  const save = async () => {
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-20">
      <h1 className="text-3xl font-semibold">Set a new password</h1>
      <Input type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" />
      <Button variant="hero" onClick={save} disabled={pw.length < 8}>Save password</Button>
    </div>
  );
}
