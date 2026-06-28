"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  FileText,
  DollarSign,
  HelpCircle,
  TrendingUp,
  Users,
  ArrowRight,
  Activity,
  Clock,
  ChevronRight,
} from "lucide-react";

interface StartupClientProps {
  startup: any;
  documents: any[];
  fundingRequests: any[];
  clarifications: any[];
  profile: any;
}

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "completed":
    case "responded":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "pending":
    case "submitted":
    case "in_review":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "rejected":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "draft":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    default:
      return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
  }
};

export default function StartupClient({
  startup,
  documents,
  fundingRequests,
  clarifications,
  profile,
}: StartupClientProps) {
  const router = useRouter();

  const pendingDocs = documents.filter((d) => d.status === "pending").length;
  const approvedDocs = documents.filter((d) => d.status === "approved").length;
  const pendingClarifications = clarifications.filter((c) => c.status === "pending").length;
  const totalFunding = fundingRequests.reduce((acc, f) => acc + (f.amount || 0), 0);

  const stats = [
    {
      label: "Company Status",
      value: startup?.status || "Unknown",
      icon: Building2,
      link: "/dashboard/startup/profile",
    },
    {
      label: "Documents Status",
      value: `${approvedDocs}/${documents.length} Approved`,
      icon: FileText,
      link: "/dashboard/startup/kyc",
    },
    {
      label: "Funding Requests",
      value: fundingRequests.length.toString(),
      icon: DollarSign,
      link: "/dashboard/startup/funding",
    },
    {
      label: "Active Clarifications",
      value: pendingClarifications.toString(),
      icon: HelpCircle,
      link: "/dashboard/startup/clarifications",
    },
  ];

  const quickStats = [
    {
      label: "Valuation",
      value: startup?.valuation ? `$${startup.valuation.toLocaleString()}` : "—",
      icon: TrendingUp,
    },
    {
      label: "Revenue",
      value: startup?.revenue_last_year ? `$${startup.revenue_last_year.toLocaleString()}` : "—",
      icon: DollarSign,
    },
    {
      label: "Team Size",
      value: startup?.team_size?.toString() || "—",
      icon: Users,
    },
    {
      label: "Funding Raised",
      value: startup?.funding_raised ? `$${startup.funding_raised.toLocaleString()}` : "—",
      icon: DollarSign,
    },
  ];

  const recentActivities = [
    ...fundingRequests.map((f) => ({
      type: "funding",
      title: f.title,
      date: f.created_at,
      status: f.status,
      link: "/dashboard/startup/funding",
    })),
    ...documents.map((d) => ({
      type: "document",
      title: d.file_name,
      date: d.uploaded_at,
      status: d.status,
      link: "/dashboard/startup/kyc",
    })),
    ...clarifications.map((c) => ({
      type: "clarification",
      title: c.question,
      date: c.created_at,
      status: c.status,
      link: "/dashboard/startup/clarifications",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const activityIcon = (type: string) => {
    switch (type) {
      case "funding":
        return DollarSign;
      case "document":
        return FileText;
      case "clarification":
        return HelpCircle;
      default:
        return Activity;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Startup Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {profile?.full_name || "Founder"}
          </p>
        </div>
        <Badge
          className={`text-sm px-3 py-1 border ${statusColor(startup?.status)}`}
        >
          {startup?.status || "Unknown"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-[#0A0F1C] border-slate-800/60 p-5 hover:border-[#C9A961]/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            onClick={() => router.push(stat.link)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A961]/5 via-transparent to-[#4F5BFF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className="text-xl font-semibold mt-1 text-white">{stat.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#C9A961]/10">
                <stat.icon className="h-5 w-5 text-[#C9A961]" />
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-1 mt-4 text-[#C9A961] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-lg bg-black/40 border border-slate-800/40"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="h-4 w-4 text-[#4F5BFF]" />
                    <span className="text-slate-400 text-sm">{stat.label}</span>
                  </div>
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Funding Requests</h2>
              <Button
                variant="ghost"
                className="text-[#C9A961] hover:text-[#C9A961] hover:bg-[#C9A961]/10"
                onClick={() => router.push("/dashboard/startup/funding")}
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            {fundingRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <DollarSign className="h-10 w-10 mx-auto mb-3 text-slate-600" />
                <p>No funding requests yet</p>
                <Button
                  className="mt-4 bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                  onClick={() => router.push("/dashboard/startup/funding")}
                >
                  Create Request
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {fundingRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-slate-800/40 hover:border-[#C9A961]/20 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-white">{req.title}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        ${req.amount?.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`border ${statusColor(req.status)}`}>
                        {req.status}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="h-10 w-10 mx-auto mb-3 text-slate-600" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => {
                  const Icon = activityIcon(activity.type);
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-slate-800/40 hover:border-slate-700/40 transition-colors cursor-pointer"
                      onClick={() => router.push(activity.link)}
                    >
                      <div className="p-2 rounded-lg bg-[#4F5BFF]/10 mt-0.5">
                        <Icon className="h-4 w-4 text-[#4F5BFF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs border ${statusColor(activity.status)}`}>
                            {activity.status}
                          </Badge>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <div className="space-y-2">
              {[
                { label: "Edit Profile", href: "/dashboard/startup/profile", icon: Building2 },
                { label: "Upload Documents", href: "/dashboard/startup/kyc", icon: FileText },
                { label: "New Funding Request", href: "/dashboard/startup/funding", icon: DollarSign },
                { label: "Pending Clarifications", href: "/dashboard/startup/clarifications", icon: HelpCircle },
              ].map((link) => (
                <Button
                  key={link.label}
                  variant="ghost"
                  className="w-full justify-between text-slate-300 hover:text-white hover:bg-white/5"
                  onClick={() => router.push(link.href)}
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="h-4 w-4 text-[#C9A961]" />
                    {link.label}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
