import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DealsClient from "./deals-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, id")
    .eq("id", user.id)
    .single() as any;

  if (!profile || profile.role !== "investor") return null;

  const { data: investor } = await supabase
    .from("investors")
    .select("id")
    .eq("user_id", user.id)
    .single() as any;

  const { data: deals } = await supabase
    .from("funding_requests")
    .select("*, startups(id, company_name, industry, stage)")
    .eq("status", "live")
    .order("live_at", { ascending: false });

  const { data: interests } = await (supabase
    .from("investor_interest") as any)
    .select("funding_request_id")
    .eq("investor_id", investor?.id || "");

  const existingInterests = (interests || []).map((i: any) => ({ funding_request_id: i.funding_request_id }));

  return {
    profile,
    investorId: investor?.id || "",
    deals: deals || [],
    existingInterests,
  };
}

export default async function DealsPage() {
  const data = await getData();
  if (!data) redirect("/login");

  return (
    <DashboardLayout role={data.profile.role} userName={data.profile.full_name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Deals</h1>
          <p className="text-gray-400 text-sm mt-1">Browse and express interest in active funding opportunities.</p>
        </div>
        <DealsClient deals={data.deals} investorId={data.investorId} existingInterests={data.existingInterests} />
      </div>
    </DashboardLayout>
  );
}
