"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "super_admin" || profile?.role === "reviewer") {
        router.push("/admin");
      } else if (profile?.role === "investor") {
        router.push("/dashboard/investor");
      } else {
        router.push("/dashboard/startup");
      }
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,169,97,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(79,91,255,0.05),_transparent_50%)]" />
        <div className="relative z-10">
          <div className="text-2xl font-bold tracking-tight">
            Estrobic<span className="text-[#C9A961]">.</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-4xl xl:text-5xl leading-tight text-white">
            Where capital meets conviction.
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Institutional-grade capital acquisition. Connecting exceptional founders with premium institutional investors.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-2xl font-mono text-[#C9A961]">$2.4B+</div>
              <div className="label-style text-gray-500 mt-1">Capital Deployed</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-[#C9A961]">180+</div>
              <div className="label-style text-gray-500 mt-1">Portfolio Companies</div>
            </div>
            <div>
              <div className="text-2xl font-mono text-[#C9A961]">12</div>
              <div className="label-style text-gray-500 mt-1">Years Active</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-xs text-gray-600">
          Estrobic Capital LLC. All rights reserved.
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 bg-[#0A0F1C] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="text-2xl font-bold tracking-tight">
              Estrobic<span className="text-[#C9A961]">.</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Sign In</h2>
            <p className="text-gray-400 text-sm">Enter your credentials to access the platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="label-style text-gray-400">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="input-dark h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="label-style text-gray-400">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-dark h-12 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-base font-medium"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={18} className="ml-2" />}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            Don&apos;t have access?{" "}
            <Link href="/signup" className="text-[#C9A961] hover:text-[#B8984D] transition-colors">
              Request access as a startup
            </Link>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-3 text-xs text-gray-600">
            <p className="font-medium text-gray-500">Test Credentials:</p>
            <div className="space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Admin</span>
                <span className="text-gray-400">admin@estrobic.com / AdminPass123!</span>
              </div>
              <div className="flex justify-between">
                <span>Startup</span>
                <span className="text-gray-400">founder@company.com / StartupPass123!</span>
              </div>
              <div className="flex justify-between">
                <span>Investor</span>
                <span className="text-gray-400">investor@fund.com / InvestorPass123!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
