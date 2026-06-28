"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Building2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "startup",
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
        role: "startup",
        status: "pending",
      });

      if (profileError) {
        toast.error("Failed to create profile.");
        setLoading(false);
        return;
      }

      // Create startup record
      const { error: startupError } = await supabase.from("startups").insert({
        user_id: authData.user.id,
        company_name: companyName,
        status: "pending",
      });

      if (startupError) {
        toast.error("Failed to create company profile.");
        setLoading(false);
        return;
      }

      toast.success("Account created. Your application is pending approval.");
      router.push("/login");
    }
    setLoading(false);
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
          <h1 className="font-display text-4xl xl:text-5xl leading-tight text-white">
            Where capital meets conviction.
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Apply for access as a startup founder. Our team will review your application and reach out.
          </p>
        </div>
        <div className="relative z-10 text-xs text-gray-600">
          Estrobic Capital LLC. All rights reserved.
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-[#0A0F1C] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="text-2xl font-bold tracking-tight">
              Estrobic<span className="text-[#C9A961]">.</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-[#C9A961]" />
              <h2 className="text-2xl font-bold text-white">Request Access</h2>
            </div>
            <p className="text-gray-400 text-sm">Apply as a startup founder. Our team will review your application.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="label-style text-gray-400">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Founder"
                className="input-dark h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="label-style text-gray-400">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                className="input-dark h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="label-style text-gray-400">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@company.com"
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
              {loading ? "Submitting..." : "Request Access"}
              {!loading && <ArrowRight size={18} className="ml-2" />}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            Already have access?{" "}
            <Link href="/login" className="text-[#C9A961] hover:text-[#B8984D] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
