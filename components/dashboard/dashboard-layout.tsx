"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  FileText,
  DollarSign,
  HelpCircle,
  Briefcase,
  Handshake,
  DoorOpen,
  Users,
  Mail,
  FileCheck,
  ClipboardList,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
  userName?: string;
  notificationCount?: number;
}

const startupNav = [
  { href: "/dashboard/startup", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/startup/profile", label: "Company Profile", icon: Building2 },
  { href: "/dashboard/startup/kyc", label: "KYC & Documents", icon: FileText },
  { href: "/dashboard/startup/funding", label: "Funding Requests", icon: DollarSign },
  { href: "/dashboard/startup/clarifications", label: "Clarifications", icon: HelpCircle },
];

const investorNav = [
  { href: "/dashboard/investor", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/investor/deals", label: "Live Deals", icon: Briefcase },
  { href: "/dashboard/investor/interests", label: "My Interests", icon: Handshake },
  { href: "/dashboard/investor/rooms", label: "Deal Rooms", icon: DoorOpen },
];

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/startups", label: "Startups", icon: Building2 },
  { href: "/admin/investors", label: "Investors", icon: Users },
  { href: "/admin/invitations", label: "Invitations", icon: Mail },
  { href: "/admin/documents", label: "KYC Review", icon: FileCheck },
  { href: "/admin/funding", label: "Funding Requests", icon: ClipboardList },
  { href: "/admin/interests", label: "Interests", icon: Handshake },
  { href: "/admin/rooms", label: "Deal Rooms", icon: DoorOpen },
  { href: "/admin/audit", label: "Audit Logs", icon: Shield },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function DashboardLayout({ children, role, userName, notificationCount = 0 }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems = role === "super_admin" || role === "reviewer" ? adminNav : role === "investor" ? investorNav : startupNav;

  const isAdmin = role === "super_admin" || role === "reviewer";
  const pageTitle = navItems.find((item) => item.href === pathname)?.label || "Dashboard";

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0A0F1C] border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Estrobic<span className="text-[#C9A961]">.</span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin ? "Admin Portal" : role === "investor" ? "Investor Portal" : "Startup Portal"}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-white/5 text-white border border-[rgba(201,169,97,0.15)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} className={isActive ? "text-[#C9A961]" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-all w-full"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-[#0A0F1C]/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="text-sm font-semibold text-white">{pageTitle}</h1>
              <p className="text-xs text-gray-500 hidden sm:block">{userName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#C9A961] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-[#14181F] border border-white/10 flex items-center justify-center text-xs font-medium text-[#C9A961]">
              {userName?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
