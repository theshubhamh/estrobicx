import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import StartupsClient from "./startups-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single() as any;
  if (!profile || (profile.role !== "super_admin" && profile.role !== "reviewer")) return null;

  const { data: startups } = await supabase
    .from("startups")
    .select("*, profiles(user_id, email, full_name)")
    .order("created_at", { ascending: false });

  return { profile, startups: startups || [] };
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
