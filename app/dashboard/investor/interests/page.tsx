import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import InterestsClient from "./interests-client";

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

  const { data: interests } = await supabase
    .from("investor_interest")
    .select("*, funding_requests(id, title)")
    .eq("investor_id", investor?.id)
    .order("created_at", { ascending: false });

  return {
    profile,
    interests: interests || [],
  };
}

export default async function InvestorInterestsPage() {
  const data = await getData();
  if (!data) redirect("/dashboard");

  const { profile, interests } = data;

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Investor"}>
      <InterestsClient interests={interests} />
    </DashboardLayout>
  );
}
