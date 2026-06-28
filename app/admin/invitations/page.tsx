import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import InvitationsClient from "./invitations-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single() as any;
  if (!profile || (profile.role !== "super_admin" && profile.role !== "reviewer")) return null;

  const { data: invitations } = await supabase
    .from("invitations")
    .select("*, invited_by_profile:profiles!invited_by(full_name, email)")
    .order("created_at", { ascending: false });

  return { profile, invitations: invitations || [] };
}

export default async function AdminInvitationsPage() {
  const data = await getData();
  if (!data) redirect("/login");

  const { profile, invitations } = data;

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Admin"}>
      <InvitationsClient invitations={invitations} />
    </DashboardLayout>
  );
}
