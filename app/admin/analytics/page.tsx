import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import AnalyticsClient from "./analytics-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileRaw } = await (supabase.from("profiles") as any).select("role, full_name").eq("id", user.id).single();
  const profile = profileRaw as { role: string; full_name: string } | null;
  if (!profile || (profile.role !== "super_admin" && profile.role !== "reviewer")) return null;

  const { data: allProfiles } = await supabase.from("profiles").select("created_at, role");
  const { data: allStartups } = await supabase.from("startups").select("created_at, industry, status");
  const { data: allInvestors } = await supabase.from("investors").select("created_at, aum, status");
  const { data: allFunding } = await supabase.from("funding_requests").select("created_at, status, amount_requested");
  const { data: allInterests } = await supabase.from("investor_interest").select("created_at, proposed_amount");
  const { data: allRooms } = await supabase.from("deal_rooms").select("created_at, status");

  return {
    profile,
    profiles: allProfiles || [],
    startups: allStartups || [],
    investors: allInvestors || [],
    fundingRequests: allFunding || [],
    interests: allInterests || [],
    dealRooms: allRooms || [],
  };
}

export default async function AdminAnalyticsPage() {
  const data = await getData();
  if (!data) redirect("/login");

  const { profile, ...rest } = data;

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Admin"}>
      <AnalyticsClient {...rest} />
    </DashboardLayout>
  );
}
