"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function createAuditLog(action: string, entityType: string, entityId: string | null, details: Record<string, unknown> = {}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await (supabase.from("audit_logs") as any).insert([{
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details as any,
  }]);
}

// --- Admin Actions ---

export async function updateStartupStatus(id: string, status: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: current } = await (supabase.from("startups") as any).select("status").eq("id", id).single();
  const previousStatus = current?.status;

  const { error } = await (supabase.from("startups") as any).update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };

  await createAuditLog("startup_status_change", "startups", id, {
    previous_status: previousStatus,
    new_status: status,
  });

  revalidatePath("/admin/startups");
  return { success: true };
}

export async function updateInvestorStatus(id: string, status: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: current } = await (supabase.from("investors") as any).select("status").eq("id", id).single();
  const previousStatus = current?.status;

  const { error } = await (supabase.from("investors") as any).update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };

  await createAuditLog("investor_status_change", "investors", id, {
    previous_status: previousStatus,
    new_status: status,
  });

  revalidatePath("/admin/investors");
  return { success: true };
}

export async function updateFundingStatus(id: string, status: string, amountApproved?: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "live") {
    updates.live_at = new Date().toISOString();
  } else if (status === "approved") {
    updates.approved_at = new Date().toISOString();
    if (amountApproved) updates.amount_approved = amountApproved;
  }

  const { data: current } = await (supabase.from("funding_requests") as any).select("status").eq("id", id).single();
  const previousStatus = current?.status;

  const { error } = await (supabase.from("funding_requests") as any).update(updates).eq("id", id);
  if (error) return { error: error.message };

  await createAuditLog("funding_status_change", "funding_requests", id, {
    previous_status: previousStatus,
    new_status: status,
    amount_approved: amountApproved || null,
  });

  revalidatePath("/admin/funding");
  return { success: true };
}

export async function updateDocumentStatus(id: string, status: string, notes?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("startup_documents") as any).update({
    status,
    admin_notes: notes || null,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };

  await createAuditLog("document_review", "startup_documents", id, { status, notes });
  revalidatePath("/admin/documents");
  return { success: true };
}

export async function createInvitation(email: string, firmName: string, investmentFocus: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error } = await (supabase.from("invitations") as any).insert({
    token,
    email,
    firm_name: firmName,
    investment_focus: investmentFocus,
    invited_by: user.id,
    expires_at: expiresAt.toISOString(),
  });
  if (error) return { error: error.message };

  await createAuditLog("invitation_created", "invitations", null, { email, firm_name: firmName });
  revalidatePath("/admin/invitations");
  return { success: true, token };
}

export async function createDealRoom(name: string, fundingRequestId: string, startupId: string, investorId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("deal_rooms") as any).insert({
    name,
    funding_request_id: fundingRequestId,
    startup_id: startupId,
    investor_id: investorId,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  await createAuditLog("deal_room_created", "deal_rooms", null, {
    funding_request_id: fundingRequestId,
    startup_id: startupId,
    investor_id: investorId,
  });
  revalidatePath("/admin/rooms");
  return { success: true };
}

export async function createClarification(startupId: string, question: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("clarification_requests") as any).insert({
    startup_id: startupId,
    requested_by: user.id,
    question,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/startups");
  return { success: true };
}

// --- Startup Actions ---

export async function submitFundingRequest(data: {
  startupId: string;
  title: string;
  description: string;
  amountRequested: number;
  equityOffered: number;
  useOfFunds: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("funding_requests") as any).insert({
    startup_id: data.startupId,
    title: data.title,
    description: data.description,
    amount_requested: data.amountRequested,
    equity_offered: data.equityOffered,
    use_of_funds: data.useOfFunds,
    status: "submitted",
    submitted_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/startup/funding");
  return { success: true };
}

export async function respondToClarification(id: string, response: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("clarification_requests") as any).update({
    response,
    status: "approved",
    responded_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/startup/clarifications");
  return { success: true };
}

export async function updateStartupProfile(data: {
  id: string;
  companyName: string;
  description: string;
  industry: string;
  stage: string;
  foundedYear: number;
  website: string;
  valuation: number;
  revenueLastYear: number;
  fundingRaisedToDate: number;
  teamSize: number;
  headquarters: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("startups") as any).update({
    company_name: data.companyName,
    description: data.description,
    industry: data.industry,
    stage: data.stage,
    founded_year: data.foundedYear,
    website: data.website,
    valuation: data.valuation,
    revenue_last_year: data.revenueLastYear,
    funding_raised_to_date: data.fundingRaisedToDate,
    team_size: data.teamSize,
    headquarters: data.headquarters,
    updated_at: new Date().toISOString(),
  }).eq("id", data.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/startup/profile");
  return { success: true };
}

// --- Investor Actions ---

export async function expressInterest(data: {
  investorId: string;
  fundingRequestId: string;
  proposedAmount: number;
  proposedTerms: string;
  notes: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("investor_interest") as any).insert({
    investor_id: data.investorId,
    funding_request_id: data.fundingRequestId,
    proposed_amount: data.proposedAmount,
    proposed_terms: data.proposedTerms,
    notes: data.notes,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/investor/interests");
  return { success: true };
}

// --- Storage ---

export async function getSignedUrl(filePath: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase.storage.from("documents").createSignedUrl(filePath, 86400);
  if (error) return { error: error.message };
  return { signedUrl: data.signedUrl };
}

export async function uploadDocument(file: File, startupId: string, docType: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const filePath = `${startupId}/${crypto.randomUUID()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await (supabase.from("startup_documents") as any).insert({
    startup_id: startupId,
    doc_type: docType,
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
  });
  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard/startup/kyc");
  return { success: true };
}

// --- Notifications ---

export async function markNotificationRead(id: string) {
  const supabase = createClient();
  const { error } = await (supabase.from("notifications") as any).update({ read: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

// --- Additional Admin Actions ---

export async function updateInterestStatus(id: string, status: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("investor_interest") as any).update({
    status,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };

  await createAuditLog("interest_status_change", "investor_interest", id, { status });
  revalidatePath("/admin/interests");
  return { success: true };
}

export async function withdrawInterest(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await (supabase.from("investor_interest") as any).delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/investor/interests");
  return { success: true };
}
