import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import StartupsClient from "./startups-client";

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

  if (!profile || (profile.role !== "super_admin" && profile.role !== "reviewer")) return null;

  const { data: startupsRaw } = await supabase
    .from("startups")
    .select("*")
    .order("created_at", { ascending: false });

  const startups = await Promise.all((startupsRaw || []).map(async (startup: any) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", startup.user_id)
      .single() as any;
    return { ...startup, profiles: profileData || null };
  }));

  return { profile, startups };
}

export default async function AdminStartupsPage() {
  const data = await getData();
  if (!data) redirect("/login");

  const { profile, startups } = data;

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Admin"}>
      <StartupsClient startups={startups} />
    </DashboardLayout>
  );
}
