"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateStartupProfile } from "@/app/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Building2,
  Globe,
  DollarSign,
  Users,
  MapPin,
  Calendar,
  Save,
  Loader2,
} from "lucide-react";

const profileSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  industry: z.string().min(1, "Industry is required"),
  stage: z.string().min(1, "Stage is required"),
  founded_year: z.coerce.number().min(1800).max(new Date().getFullYear()).optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  valuation: z.coerce.number().min(0).optional(),
  revenue_last_year: z.coerce.number().min(0).optional(),
  funding_raised: z.coerce.number().min(0).optional(),
  team_size: z.coerce.number().min(0).optional(),
  headquarters: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileClientProps {
  startup: any;
  profile: any;
}

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "pending":
    case "in_review":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "rejected":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
  }
};

const stages = [
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "Growth",
  "Late Stage",
  "IPO",
];

const industries = [
  "Technology",
  "FinTech",
  "HealthTech",
  "EdTech",
  "AgriTech",
  "CleanTech",
  "E-commerce",
  "SaaS",
  "AI/ML",
  "Biotech",
  "Gaming",
  "Mobility",
  "Real Estate",
  "Other",
];

export default function ProfileClient({ startup, profile }: ProfileClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: startup?.company_name || "",
      description: startup?.description || "",
      industry: startup?.industry || "",
      stage: startup?.stage || "",
      founded_year: startup?.founded_year || undefined,
      website: startup?.website || "",
      valuation: startup?.valuation || undefined,
      revenue_last_year: startup?.revenue_last_year || undefined,
      funding_raised: startup?.funding_raised || undefined,
      team_size: startup?.team_size || undefined,
      headquarters: startup?.headquarters || "",
    },
  });

  async function onSubmit(data: ProfileFormData) {
    setIsSubmitting(true);
    try {
      const result = await updateStartupProfile(startup?.id, data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Startup Profile</h1>
          <p className="text-slate-400 mt-1">
            Manage your company information
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1 border ${statusColor(startup?.status)}`}>
          {startup?.status || "Unknown"}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A961]/5 via-transparent to-[#4F5BFF]/5 opacity-50" />
            <div className="relative z-10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#C9A961]" />
                Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Inc."
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-[#4F5BFF]" />
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://acme.com"
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/40 border-slate-800/60 text-white focus:ring-[#C9A961]/20">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#0A0F1C] border-slate-800/60">
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind} className="text-white hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10">
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/40 border-slate-800/60 text-white focus:ring-[#C9A961]/20">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#0A0F1C] border-slate-800/60">
                          {stages.map((s) => (
                            <SelectItem key={s} value={s} className="text-white hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="founded_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[#4F5BFF]" />
                        Founded Year
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2020"
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headquarters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#4F5BFF]" />
                        Headquarters
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="San Francisco, CA"
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your company..."
                          rows={4}
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>

          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4F5BFF]/5 via-transparent to-[#C9A961]/5 opacity-50" />
            <div className="relative z-10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#C9A961]" />
                Financials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="valuation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valuation (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10000000"
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="revenue_last_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenue Last Year (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500000"
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="funding_raised"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Raised (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2000000"
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="team_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-[#4F5BFF]" />
                        Team Size
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="25"
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90 px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
