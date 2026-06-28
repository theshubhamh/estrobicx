import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StartupClient from "./startup-client";

export default async function StartupDashboardPage() {
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

  const { data: documents } = await supabase
    .from("startup_documents")
    .select("*")
    .eq("startup_id", startup?.id)
    .order("uploaded_at", { ascending: false });

  const { data: funding } = await supabase
    .from("funding_requests")
    .select("*")
    .eq("startup_id", startup?.id)
    .order("created_at", { ascending: false });

  const { data: clarifications } = await supabase
    .from("clarification_requests")
    .select("*")
    .eq("startup_id", startup?.id)
    .order("created_at", { ascending: false });

  return (
    <StartupClient
      startup={startup}
      documents={documents || []}
      fundingRequests={funding || []}
      clarifications={clarifications || []}
      profile={profile}
    />
  );
}
