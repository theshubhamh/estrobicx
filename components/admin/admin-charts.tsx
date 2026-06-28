"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#C9A961", "#4F5BFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280"];

export function ActivityChart({ data }: { data: Array<{ month: string; startups: number; funding: number; interest: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
        <YAxis stroke="#6B7280" fontSize={12} />
        <Tooltip contentStyle={{ backgroundColor: "#0A0F1C", border: "1px solid rgba(201,169,97,0.15)", borderRadius: "8px", color: "#fff" }} />
        <Bar dataKey="startups" fill="#C9A961" radius={[4, 4, 0, 0]} />
        <Bar dataKey="funding" fill="#4F5BFF" radius={[4, 4, 0, 0]} />
        <Bar dataKey="interest" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: "#0A0F1C", border: "1px solid rgba(201,169,97,0.15)", borderRadius: "8px", color: "#fff" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { COLORS };
