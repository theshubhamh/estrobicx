"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Shield, CheckCircle, XCircle } from "lucide-react";

export default function InvitePage({ params }: { params: { token: string } }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkToken() {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("token", params.token)
        .single();

      if (error || !data || data.status !== "pending" || new Date(data.expires_at) < new Date()) {
        setValid(false);
        setChecking(false);
        return;
      }

      setValid(true);
      setInvitationData(data);
      setEmail(data.email);
      setFirmName(data.firm_name || "");
      setChecking(false);
    }
    checkToken();
  }, [params.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "investor",
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: "investor",
        status: "pending",
      });

      if (profileError) {
        toast.error("Failed to create profile.");
        setLoading(false);
        return;
      }

      // Create investor record
      const { error: investorError } = await supabase.from("investors").insert({
        user_id: authData.user.id,
        firm_name: firmName,
        investment_focus: invitationData?.investment_focus || [],
        status: "pending",
      });

      if (investorError) {
        toast.error("Failed to create investor profile.");
        setLoading(false);
        return;
      }

      // Mark invitation as used
      await supabase
        .from("invitations")
        .update({ status: "approved", used_at: new Date().toISOString(), used_by: authData.user.id })
        .eq("id", invitationData.id);

      toast.success("Account created. Your application is pending approval.");
      router.push("/login");
    }
    setLoading(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A961] mx-auto" />
          <p className="text-gray-400 text-sm">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <XCircle size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Invalid Invitation</h2>
          <p className="text-gray-400 text-sm">
            This invitation link is invalid, expired, or has already been used.
          </p>
          <p className="text-gray-500 text-xs">
            Please contact your relationship manager for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,169,97,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(79,91,255,0.05),_transparent_50%)]" />
        <div className="relative z-10">
          <div className="text-2xl font-bold tracking-tight">
            Estrobic<span className="text-[#C9A961]">.</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-[#C9A961]" />
            <span className="text-[#C9A961] text-sm font-medium">Invitation Verified</span>
          </div>
          <h1 className="font-display text-4xl xl:text-5xl leading-tight text-white">
            Welcome to the investor network.
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Complete your registration to access exclusive deal flow and portfolio analytics.
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
          </div>
        </div>
        <div className="relative z-10 text-xs text-gray-600">
          Estrobic Capital LLC. All rights reserved.
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-[#0A0F1C] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-[#C9A961]" />
              <h2 className="text-2xl font-bold text-white">Investor Registration</h2>
            </div>
            <p className="text-gray-400 text-sm">Complete your profile to access the deal platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="label-style text-gray-400">Invited Email</Label>
              <Input
                value={email}
                disabled
                className="input-dark h-12 opacity-60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="label-style text-gray-400">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sarah Capital"
                className="input-dark h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firmName" className="label-style text-gray-400">Firm Name</Label>
              <Input
                id="firmName"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                placeholder="Horizon Ventures"
                className="input-dark h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="label-style text-gray-400">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="input-dark h-12"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-base font-medium"
            >
              {loading ? "Creating Account..." : "Complete Registration"}
              {!loading && <ArrowRight size={18} className="ml-2" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
