import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import RoomsClient from "./rooms-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single() as any;

  if (!profile || profile.role !== "investor") return null;

  const { data: investor } = await supabase
    .from("investors")
    .select("id")
    .eq("user_id", user.id)
    .single() as any;

  const { data: dealRooms } = await supabase
    .from("deal_rooms")
    .select("*, funding_requests(id, title), startups(id, company_name)")
    .eq("investor_id", investor?.id)
    .order("created_at", { ascending: false });

  return {
    profile,
    dealRooms: dealRooms || [],
  };
}

export default async function InvestorRoomsPage() {
  const data = await getData();
  if (!data) redirect("/dashboard");

  return (
    <DashboardLayout role={data.profile.role} userName={data.profile.full_name || "Investor"}>
      <RoomsClient dealRooms={data.dealRooms} />
    </DashboardLayout>
  );
}
