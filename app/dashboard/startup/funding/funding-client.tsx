"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { submitFundingRequest } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DollarSign,
  Plus,
  Loader2,
  Eye,
  Trash2,
  Pencil,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  TrendingUp,
} from "lucide-react";

const fundingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  equity_offered: z.string().optional(),
  use_of_funds: z.string().min(1, "Use of funds is required"),
});

type FundingFormData = z.infer<typeof fundingSchema>;

interface FundingClientProps {
  startup: any;
  fundingRequests: any[];
  profile: any;
}

const statusFlow = [
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "In Review", value: "in_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  draft: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: FileText },
  submitted: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  in_review: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  rejected: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  completed: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
};

export default function FundingClient({ startup, fundingRequests: initialFunding, profile }: FundingClientProps) {
  const [fundingRequests, setFundingRequests] = useState(initialFunding);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const supabase = createClient();

  const form = useForm<FundingFormData>({
    resolver: zodResolver(fundingSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: undefined,
      equity_offered: "",
      use_of_funds: "",
    },
  });

  async function onSubmit(data: FundingFormData) {
    if (!startup?.id) {
      toast.error("Startup not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitFundingRequest({
        ...data,
        startupId: startup.id,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Funding request submitted successfully");
        setIsDialogOpen(false);
        form.reset();
        // Refresh
        const { data: newFunding } = await supabase
          .from("funding_requests")
          .select("*")
          .eq("startup_id", startup.id)
          .order("created_at", { ascending: false });
        if (newFunding) setFundingRequests(newFunding);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit funding request");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
    try {
      const { error } = await supabase.from("funding_requests").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete request");
        return;
      }
      toast.success("Funding request deleted");
      setFundingRequests((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeleteId(null);
    }
  }

  const canEdit = (status: string) => status === "draft";
  const canDelete = (status: string) => status === "draft";

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funding Requests</h1>
          <p className="text-slate-400 mt-1">
            Submit and track your funding requests
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0A0F1C] border-slate-800/60 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">New Funding Request</DialogTitle>
              <DialogDescription className="text-slate-400">
                Submit a new funding request to Estrobic Capital
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Series A Funding"
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
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your funding needs..."
                          rows={3}
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-[#C9A961]" />
                        Amount Requested (USD)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000000"
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
                  name="equity_offered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-[#4F5BFF]" />
                        Equity Offered
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 15%"
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
                  name="use_of_funds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Use of Funds</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How will the funds be used?"
                          rows={3}
                          className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Funding Flow Visualization */}
      <Card className="bg-[#0A0F1C] border-slate-800/60 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9A961]/5 via-transparent to-[#4F5BFF]/5 opacity-50" />
        <div className="relative z-10">
          <h2 className="text-lg font-semibold mb-4">Funding Request Flow</h2>
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {statusFlow.map((step, idx) => {
              const StatusIcon = statusConfig[step.value]?.icon || Clock;
              return (
                <div key={step.value} className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`p-2 rounded-lg border ${statusConfig[step.value]?.color || "bg-slate-800 text-slate-400 border-slate-700"}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{step.label}</span>
                  </div>
                  {idx < statusFlow.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-slate-600 shrink-0 mt-[-12px]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Funding Requests List */}
      <Card className="bg-[#0A0F1C] border-slate-800/60 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4F5BFF]/5 via-transparent to-[#C9A961]/5 opacity-50" />
        <div className="relative z-10">
          <h2 className="text-lg font-semibold mb-4">Your Requests</h2>

          {fundingRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <p>No funding requests yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Click "New Request" to submit your first funding request
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800/60 hover:bg-transparent">
                    <TableHead className="text-slate-400">Title</TableHead>
                    <TableHead className="text-slate-400">Amount</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Submitted</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundingRequests.map((req) => {
                    const status = req.status || "draft";
                    const config = statusConfig[status] || statusConfig.draft;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow
                        key={req.id}
                        className="border-slate-800/60 hover:bg-white/5"
                      >
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-[#C9A961]" />
                            {req.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          ${req.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`border ${config.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {req.created_at
                            ? new Date(req.created_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-white hover:bg-white/5"
                              onClick={() => {
                                setSelectedRequest(req);
                                setDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit(status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-[#C9A961] hover:bg-[#C9A961]/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete(status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => handleDelete(req.id)}
                                disabled={deleteId === req.id}
                              >
                                {deleteId === req.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-[#0A0F1C] border-slate-800/60 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Funding Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedRequest.title}</h3>
                <Badge className={`border ${statusConfig[selectedRequest.status]?.color || "bg-slate-800 text-slate-400"}`}>
                  {selectedRequest.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-slate-800/40">
                  <span className="text-slate-400">Amount Requested</span>
                  <span className="font-semibold text-[#C9A961]">
                    ${selectedRequest.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-slate-800/40">
                  <span className="text-slate-400">Equity Offered</span>
                  <span className="font-semibold">{selectedRequest.equity_offered || "—"}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-slate-800/40">
                  <span className="text-slate-400">Submitted Date</span>
                  <span className="font-semibold">
                    {selectedRequest.created_at
                      ? new Date(selectedRequest.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Description</Label>
                <p className="text-sm text-white p-3 rounded-lg bg-black/40 border border-slate-800/40">
                  {selectedRequest.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Use of Funds</Label>
                <p className="text-sm text-white p-3 rounded-lg bg-black/40 border border-slate-800/40">
                  {selectedRequest.use_of_funds}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setDetailOpen(false)}
              className="bg-slate-800 text-white hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
