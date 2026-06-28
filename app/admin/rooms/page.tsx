import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import RoomsClient from "./rooms-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single() as any;
  if (!profile || (profile.role !== "super_admin" && profile.role !== "reviewer")) return null;

  const { data: rooms } = await supabase
    .from("deal_rooms")
    .select("*, funding_requests(id, title, amount_requested), startups(id, company_name), investors(id, firm_name, full_name)")
    .order("created_at", { ascending: false });

  const { data: fundingRequests } = await supabase
    .from("funding_requests")
    .select("id, title, startup_id")
    .eq("status", "live")
    .order("created_at", { ascending: false });

  const { data: startups } = await supabase
    .from("startups")
    .select("id, company_name")
    .eq("status", "approved")
    .order("company_name", { ascending: true });

  const { data: investors } = await supabase
    .from("investors")
    .select("id, firm_name, full_name")
    .eq("status", "approved")
    .order("firm_name", { ascending: true });

  return {
    profile,
    rooms: rooms || [],
    fundingRequests: fundingRequests || [],
    startups: startups || [],
    investors: investors || [],
  };
}

export default async function AdminRoomsPage() {
  const data = await getData();
  if (!data) redirect("/login");

  const { profile, rooms, fundingRequests, startups, investors } = data;

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Admin"}>
      <RoomsClient
        rooms={rooms}
        fundingRequests={fundingRequests}
        startups={startups}
        investors={investors}
      />
    </DashboardLayout>
  );
}
