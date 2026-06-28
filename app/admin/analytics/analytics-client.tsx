"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Users,
  Building2,
  Briefcase,
  DollarSign,
  Handshake,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface RawItem {
  created_at: string;
  [key: string]: any;
}

interface AnalyticsClientProps {
  profiles: RawItem[];
  startups: RawItem[];
  investors: RawItem[];
  fundingRequests: RawItem[];
  interests: RawItem[];
  dealRooms: RawItem[];
}

type Period = "7d" | "30d" | "90d" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  all: "All Time",
};

const COLORS = ["#C9A961", "#4F5BFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16", "#6366F1"];

const DARK_TOOLTIP = {
  backgroundColor: "#0A0F1C",
  border: "1px solid rgba(201,169,97,0.15)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

function getPeriodStart(period: Period): Date | null {
  if (period === "all") return null;
  const now = new Date();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function filterByPeriod<T extends RawItem>(items: T[], period: Period): T[] {
  const start = getPeriodStart(period);
  if (!start) return items;
  return items.filter((item) => new Date(item.created_at) >= start);
}

function groupByDate(items: RawItem[], dateKey: string = "created_at"): Record<string, number> {
  const map: Record<string, number> = {};
  items.forEach((item) => {
    const date = new Date(item[dateKey]).toISOString().split("T")[0];
    map[date] = (map[date] || 0) + 1;
  });
  return map;
}

function fillDateSeries(
  counts: Record<string, number>,
  period: Period
): { date: string; label: string; count: number }[] {
  const start = getPeriodStart(period);
  const end = new Date();
  const result: { date: string; label: string; count: number }[] = [];

  const current = start ? new Date(start) : new Date(end);
  if (period === "all") {
    // For all time, use monthly buckets
    const dates = Object.keys(counts).sort();
    if (dates.length === 0) return [];
    let cur = new Date(dates[0] + "T00:00:00");
    const last = new Date();
    while (cur <= last) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
      const label = cur.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const count = Object.entries(counts).filter(([d]) => d.startsWith(key)).reduce((sum, [, c]) => sum + c, 0);
      result.push({ date: key, label, count });
      cur.setMonth(cur.getMonth() + 1);
    }
    return result;
  }

  // For fixed periods, daily buckets
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const label =
      period === "7d"
        ? current.toLocaleDateString("en-US", { weekday: "short" })
        : current.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    result.push({ date: dateStr, label, count: counts[dateStr] || 0 });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export default function AnalyticsClient({
  profiles,
  startups,
  investors,
  fundingRequests,
  interests,
  dealRooms,
}: AnalyticsClientProps) {
  const [period, setPeriod] = useState<Period>("30d");

  const filteredProfiles = useMemo(() => filterByPeriod(profiles, period), [profiles, period]);
  const filteredStartups = useMemo(() => filterByPeriod(startups, period), [startups, period]);
  const filteredInvestors = useMemo(() => filterByPeriod(investors, period), [investors, period]);
  const filteredFunding = useMemo(() => filterByPeriod(fundingRequests, period), [fundingRequests, period]);
  const filteredInterests = useMemo(() => filterByPeriod(interests, period), [interests, period]);
  const filteredRooms = useMemo(() => filterByPeriod(dealRooms, period), [dealRooms, period]);

  // Stat cards
  const totalSignups = filteredProfiles.length;
  const activeStartups = filteredStartups.filter((s) => s.status === "approved").length;
  const activeInvestors = filteredInvestors.filter((i) => i.status === "approved").length;
  const liveDeals = filteredFunding.filter((f) => f.status === "live").length;
  const totalInterest = filteredInterests.length;
  const totalDealRooms = filteredRooms.length;
  const conversionRate =
    totalSignups > 0
      ? Math.round(((activeStartups + activeInvestors) / totalSignups) * 100)
      : 0;

  // Line chart: Signups over time
  const signupCounts = useMemo(() => groupByDate(filteredProfiles), [filteredProfiles]);
  const signupSeries = useMemo(() => fillDateSeries(signupCounts, period), [signupCounts, period]);

  // Bar chart: Funding requests by status
  const fundingStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredFunding.forEach((f) => {
      counts[f.status] = (counts[f.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
      rawStatus: status,
    }));
  }, [filteredFunding]);

  // Area chart: Interests over time
  const interestCounts = useMemo(() => groupByDate(filteredInterests), [filteredInterests]);
  const interestSeries = useMemo(() => fillDateSeries(interestCounts, period), [interestCounts, period]);

  // Pie chart: Startups by industry
  const industryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredStartups.forEach((s) => {
      const industry = s.industry || "Unknown";
      counts[industry] = (counts[industry] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredStartups]);

  // Bar chart: Investors by AUM range
  const aumRanges = useMemo(() => {
    const ranges: Record<string, number> = {
      "<$1M": 0,
      "$1M-$5M": 0,
      "$5M-$25M": 0,
      "$25M-$100M": 0,
      "$100M-$500M": 0,
      "$500M+": 0,
      Unknown: 0,
    };
    filteredInvestors.forEach((inv) => {
      const aum = inv.aum as number | null;
      if (!aum) {
        ranges["Unknown"] += 1;
      } else if (aum < 1_000_000) {
        ranges["<$1M"] += 1;
      } else if (aum < 5_000_000) {
        ranges["$1M-$5M"] += 1;
      } else if (aum < 25_000_000) {
        ranges["$5M-$25M"] += 1;
      } else if (aum < 100_000_000) {
        ranges["$25M-$100M"] += 1;
      } else if (aum < 500_000_000) {
        ranges["$100M-$500M"] += 1;
      } else {
        ranges["$500M+"] += 1;
      }
    });
    return Object.entries(ranges)
      .filter(([, count]) => count > 0)
      .map(([range, count]) => ({ name: range, count }));
  }, [filteredInvestors]);

  const stats = [
    {
      label: "Total Signups",
      value: totalSignups,
      icon: Users,
      change: null,
    },
    {
      label: "Active Startups",
      value: activeStartups,
      icon: Building2,
      change: null,
    },
    {
      label: "Active Investors",
      value: activeInvestors,
      icon: Briefcase,
      change: null,
    },
    {
      label: "Live Deals",
      value: liveDeals,
      icon: DollarSign,
      change: null,
    },
    {
      label: "Total Interest",
      value: totalInterest,
      icon: Activity,
      change: null,
    },
    {
      label: "Total Deal Rooms",
      value: totalDealRooms,
      icon: Handshake,
      change: null,
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      change: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Platform metrics and insights.
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="bg-[#0A0F1C] border border-white/10">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <TabsTrigger
                key={p}
                value={p}
                className="data-[state=active]:bg-[#C9A961] data-[state=active]:text-black text-gray-400 text-xs"
              >
                {PERIOD_LABELS[p]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-[#0A0F1C] border-white/5 card-glow"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={16} className="text-[#C9A961]" />
                {stat.change !== null && (
                  <div className="flex items-center gap-0.5 text-xs">
                    {stat.change >= 0 ? (
                      <ArrowUpRight size={12} className="text-emerald-400" />
                    ) : (
                      <ArrowDownRight size={12} className="text-red-400" />
                    )}
                    <span className={stat.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {stat.change}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-xl font-mono font-bold text-white mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signups Line Chart */}
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Signups Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signupSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="label"
                    stroke="#6B7280"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={DARK_TOOLTIP}
                    formatter={(value: number) => [value, "Signups"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#C9A961"
                    strokeWidth={2}
                    dot={{ fill: "#C9A961", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "#C9A961" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Funding Requests Bar Chart */}
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Funding Requests by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundingStatusCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    stroke="#6B7280"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={DARK_TOOLTIP}
                    formatter={(value: number) => [value, "Requests"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {fundingStatusCounts.map((entry, index) => (
                      <Cell key={entry.rawStatus} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Interests Area Chart */}
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Investor Interests Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={interestSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="label"
                    stroke="#6B7280"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={DARK_TOOLTIP}
                    formatter={(value: number) => [value, "Interests"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#4F5BFF"
                    fill="#4F5BFF"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Startups Pie Chart */}
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Startups by Industry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={industryCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {industryCounts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={DARK_TOOLTIP}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", color: "#9CA3AF" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Investors AUM Bar Chart */}
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Investors by AUM Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aumRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    stroke="#6B7280"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={DARK_TOOLTIP}
                    formatter={(value: number) => [value, "Investors"]}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Metrics Summary */}
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Period Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SummaryRow
                label="New Profiles"
                value={totalSignups}
                total={profiles.length}
                color="#C9A961"
              />
              <SummaryRow
                label="New Startups"
                value={filteredStartups.length}
                total={startups.length}
                color="#4F5BFF"
              />
              <SummaryRow
                label="New Investors"
                value={filteredInvestors.length}
                total={investors.length}
                color="#10B981"
              />
              <SummaryRow
                label="New Funding Requests"
                value={filteredFunding.length}
                total={fundingRequests.length}
                color="#F59E0B"
              />
              <SummaryRow
                label="New Interests"
                value={filteredInterests.length}
                total={interests.length}
                color="#EF4444"
              />
              <SummaryRow
                label="New Deal Rooms"
                value={filteredRooms.length}
                total={dealRooms.length}
                color="#8B5CF6"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-mono text-white">
          {value} <span className="text-gray-500">/ {total}</span>
        </span>
      </div>
      <div className="w-full h-2 bg-black rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-600 mt-0.5">{pct}% of all time</p>
    </div>
  );
}
