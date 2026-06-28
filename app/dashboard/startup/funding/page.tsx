import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FundingClient from "./funding-client";

export default async function StartupFundingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, status")
    .eq("id", user.id)
    .single() as any;

  if (!profile || profile.role !== "startup") return redirect("/dashboard");

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("user_id", user.id)
    .single() as any;

  const { data: funding } = await supabase
    .from("funding_requests")
    .select("*")
    .eq("startup_id", startup?.id)
    .order("created_at", { ascending: false });

  return (
    <FundingClient
      fundingRequests={funding || []}
      profile={profile}
      startup={startup}
    />
  );
}
