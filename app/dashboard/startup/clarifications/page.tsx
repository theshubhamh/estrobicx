import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClarificationsClient from "./clarifications-client";

export default async function StartupClarificationsPage() {
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

  const { data: clarifications } = await supabase
    .from("clarification_requests")
    .select("*")
    .eq("startup_id", startup?.id)
    .order("created_at", { ascending: false });

  return (
    <ClarificationsClient
      clarifications={clarifications || []}
      profile={profile}
      startup={startup}
    />
  );
}
