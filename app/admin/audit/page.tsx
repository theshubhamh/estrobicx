import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import AuditClient from "./audit-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single() as any;
  if (!profile || (profile.role !== "super_admin" && profile.role !== "reviewer")) return null;

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*, profiles(user_id, email, full_name)")
    .order("created_at", { ascending: false });

  return { profile, auditLogs: auditLogs || [] };
}

export default async function AdminAuditPage() {
  const data = await getData();
  if (!data) redirect("/login");

  const { profile, auditLogs } = data;

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Admin"}>
      <AuditClient auditLogs={auditLogs} />
    </DashboardLayout>
  );
}
