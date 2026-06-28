import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import InvestorClient from "./investor-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, status")
    .eq("id", user.id)
    .single() as any;

  if (!profile || profile.role !== "investor") return null;

  const { data: investor } = await supabase
    .from("investors")
    .select("id")
    .eq("user_id", user.id)
    .single() as any;

  const { data: interests } = await supabase
    .from("investor_interest")
    .select("*, funding_requests(id, title, startup_id)")
    .eq("investor_id", investor?.id)
    .order("created_at", { ascending: false });

  const { data: dealRooms } = await supabase
    .from("deal_rooms")
    .select("*, funding_requests(id, title), startups(id, company_name)")
    .eq("investor_id", investor?.id)
    .order("created_at", { ascending: false });

  const { data: liveDeals } = await supabase
    .from("funding_requests")
    .select("*")
    .eq("status", "live")
    .order("created_at", { ascending: false });

  return {
    profile,
    investor,
    interests: interests || [],
    dealRooms: dealRooms || [],
    liveDeals: liveDeals || [],
  };
}

export default async function InvestorDashboardPage() {
  const data = await getData();
  if (!data) redirect("/dashboard");

  const { profile, investor, interests, dealRooms, liveDeals } = data;

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Investor"}>
      <InvestorClient
        investor={investor}
        interests={interests}
        dealRooms={dealRooms}
        liveDeals={liveDeals}
        profile={profile}
      />
    </DashboardLayout>
  );
}
