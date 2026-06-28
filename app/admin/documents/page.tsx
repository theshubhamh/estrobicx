import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DocumentsClient from "./documents-client";

export const revalidate = 0;

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single() as any;
  if (!profile || (profile.role !== "super_admin" && profile.role !== "reviewer")) return null;

  const { data: documents } = await supabase
    .from("startup_documents")
    .select("*, startups(id, company_name)")
    .order("uploaded_at", { ascending: false });

  return { profile, documents: documents || [] };
}

export default async function AdminDocumentsPage() {
  const data = await getData();
  if (!data) redirect("/login");

  const { profile, documents } = data;

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Admin"}>
      <DocumentsClient documents={documents} />
    </DashboardLayout>
  );
}
