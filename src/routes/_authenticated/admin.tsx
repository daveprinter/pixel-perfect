import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useAdminData } from "@/components/admin/shared";
import { Overview } from "@/components/admin/Overview";
import { Bookings, Expenses, Messages, Payments, Placements } from "@/components/admin/Operations";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — HomeShift" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const { data, isLoading, error } = useAdminData();

  if (loading || isLoading) return <p className="p-10 text-center text-muted-foreground">Loading admin…</p>;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">This area needs an admin account. If you're staff, activate access with your setup code.</p>
        <Button asChild variant="hero" className="mt-6"><Link to="/admin-setup">Activate admin access</Link></Button>
      </div>
    );
  if (error || !data) return <p className="p-10 text-center text-destructive">Could not load admin data.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {user?.email}</p>
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><Overview d={data} /></TabsContent>
        <TabsContent value="bookings" className="mt-6"><Bookings d={data} /></TabsContent>
        <TabsContent value="placements" className="mt-6"><Placements d={data} /></TabsContent>
        <TabsContent value="payments" className="mt-6"><Payments d={data} /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><Expenses d={data} /></TabsContent>
        <TabsContent value="messages" className="mt-6"><Messages d={data} uid={user!.id} /></TabsContent>
      </Tabs>
    </div>
  );
}
