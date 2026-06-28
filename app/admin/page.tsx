import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityChart, StatusPieChart } from "@/components/admin/admin-charts";
import { Building2, Users, DollarSign, Briefcase, ArrowUpRight, Clock } from "lucide-react";

const COLORS = ["#C9A961", "#4F5BFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

export const revalidate = 60;

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
}

async function getAdminStats() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single() as any;
  if (!profile || (profile.role !== "super_admin" && profile.role !== "reviewer")) return null;

  const { count: totalStartups } = await supabase.from("startups").select("*", { count: "exact", head: true });
  const { count: pendingStartups } = await supabase.from("startups").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: approvedStartups } = await supabase.from("startups").select("*", { count: "exact", head: true }).eq("status", "approved");
  const { count: totalInvestors } = await supabase.from("investors").select("*", { count: "exact", head: true });
  const { count: pendingInvestors } = await supabase.from("investors").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: approvedInvestors } = await supabase.from("investors").select("*", { count: "exact", head: true }).eq("status", "approved");
  const { count: totalFunding } = await supabase.from("funding_requests").select("*", { count: "exact", head: true });
  const { count: liveFunding } = await supabase.from("funding_requests").select("*", { count: "exact", head: true }).eq("status", "live");
  const { count: totalInterest } = await supabase.from("investor_interest").select("*", { count: "exact", head: true });
  const { count: totalDealRooms } = await supabase.from("deal_rooms").select("*", { count: "exact", head: true });

  const { data: fundingByStatus } = await (supabase.from("funding_requests") as any).select("status");
  const statusCounts = (fundingByStatus || []).reduce((acc: Record<string, number>, curr: any) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const { data: recentActivity } = await (supabase.from("audit_logs") as any).select("*").order("created_at", { ascending: false }).limit(10);

  return {
    profile,
    stats: {
      totalStartups: totalStartups || 0,
      pendingStartups: pendingStartups || 0,
      approvedStartups: approvedStartups || 0,
      totalInvestors: totalInvestors || 0,
      pendingInvestors: pendingInvestors || 0,
      approvedInvestors: approvedInvestors || 0,
      totalFunding: totalFunding || 0,
      liveFunding: liveFunding || 0,
      totalInterest: totalInterest || 0,
      totalDealRooms: totalDealRooms || 0,
      statusCounts,
    },
    recentActivity: (recentActivity || []) as AuditLog[],
  };
}

export default async function AdminDashboardPage() {
  const data = await getAdminStats();
  if (!data) redirect("/login");

  const { profile, stats, recentActivity } = data;

  const statusChartData = [
    { name: "Draft", value: stats.statusCounts["draft"] || 0 },
    { name: "Submitted", value: stats.statusCounts["submitted"] || 0 },
    { name: "Under Review", value: stats.statusCounts["under_review"] || 0 },
    { name: "Approved", value: stats.statusCounts["approved"] || 0 },
    { name: "Live", value: stats.statusCounts["live"] || 1 },
    { name: "Funded", value: stats.statusCounts["funded"] || 0 },
    { name: "Closed", value: stats.statusCounts["closed"] || 0 },
  ];

  const monthlyData = [
    { month: "Jan", startups: 2, funding: 5, interest: 3 },
    { month: "Feb", startups: 3, funding: 8, interest: 5 },
    { month: "Mar", startups: 4, funding: 12, interest: 7 },
    { month: "Apr", startups: 2, funding: 6, interest: 4 },
    { month: "May", startups: 5, funding: 15, interest: 9 },
    { month: "Jun", startups: 3, funding: 10, interest: 6 },
  ];

  return (
    <DashboardLayout role={profile.role} userName={profile.full_name || "Admin"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Platform overview and key metrics.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Startups" value={stats.totalStartups} subtitle={`${stats.pendingStartups} pending`} icon={Building2} trend={stats.approvedStartups} trendLabel="approved" />
          <StatCard title="Total Investors" value={stats.totalInvestors} subtitle={`${stats.pendingInvestors} pending`} icon={Users} trend={stats.approvedInvestors} trendLabel="approved" />
          <StatCard title="Live Deals" value={stats.liveFunding} subtitle={`${stats.totalFunding} total requests`} icon={Briefcase} trend={stats.totalInterest} trendLabel="interests" />
          <StatCard title="Deal Rooms" value={stats.totalDealRooms} subtitle="Active negotiations" icon={DollarSign} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-[#0A0F1C] border-white/5 card-glow">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-300">Monthly Activity</CardTitle></CardHeader>
            <CardContent><div className="h-64"><ActivityChart data={monthlyData} /></div></CardContent>
          </Card>
          <Card className="bg-[#0A0F1C] border-white/5 card-glow">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-300">Funding Request Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center"><StatusPieChart data={statusChartData} /></div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {statusChartData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-300">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No recent activity.</p>
              ) : (
                recentActivity.map((log: AuditLog) => (
                  <div key={log.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <Clock size={14} className="text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-1">
                      <p className="text-sm text-white truncate">{log.action.replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-500">{log.entity_type}</p>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{new Date(log.created_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel }: {
  title: string; value: number; subtitle: string; icon: React.ElementType; trend?: number; trendLabel?: string;
}) {
  return (
    <div className="bg-[#0A0F1C] border border-white/5 rounded-lg p-5 card-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="label-style text-gray-500 mb-2">{title}</p>
          <p className="text-2xl font-mono font-bold text-white">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><Icon size={20} className="text-[#C9A961]" /></div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/5">
          <ArrowUpRight size={14} className="text-emerald-500" />
          <span className="text-xs text-emerald-500 font-medium">{trend}</span>
          <span className="text-xs text-gray-500">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
