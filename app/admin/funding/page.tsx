import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import FundingClient from "./funding-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single() as any;
  if (!profile || (profile.role !== "super_admin" && profile.role !== "reviewer")) return null;

  const { data: fundingRequests } = await supabase
    .from("funding_requests")
    .select("*, startups(id, company_name, industry)")
    .order("created_at", { ascending: false });

  return { profile, fundingRequests: fundingRequests || [] };
}

export default async function AdminFundingPage() {
  const data = await getData();
  if (!data) redirect("/login");

  const { profile, fundingRequests } = data;

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Admin"}>
      <FundingClient fundingRequests={fundingRequests} />
    </DashboardLayout>
  );
}
