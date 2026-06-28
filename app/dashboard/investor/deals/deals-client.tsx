"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Briefcase,
  Search,
  DollarSign,
  Percent,
  Factory,
  Rocket,
  Heart,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { expressInterest } from "@/app/actions";

interface Deal {
  id: string;
  title: string;
  description: string | null;
  amount_requested: number | null;
  equity_offered: number | null;
  status: string;
  created_at: string;
  startups: {
    id: string;
    company_name: string | null;
    industry: string | null;
    stage: string | null;
  } | null;
}

interface ExistingInterest {
  funding_request_id: string;
  status: string;
}

interface DealsClientProps {
  deals: Deal[];
  investorId: string;
  existingInterests: ExistingInterest[];
}

const interestSchema = z.object({
  proposedAmount: z.string().min(1, "Amount is required"),
  proposedTerms: z.string().min(1, "Terms are required"),
  notes: z.string().optional(),
});

type InterestFormValues = z.infer<typeof interestSchema>;

const ITEMS_PER_PAGE = 10;

export default function DealsClient({
  deals,
  investorId,
  existingInterests,
}: DealsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InterestFormValues>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      proposedAmount: "",
      proposedTerms: "",
      notes: "",
    },
  });

  const industries = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => {
      if (d.startups?.industry) set.add(d.startups.industry);
    });
    return Array.from(set).sort();
  }, [deals]);

  const stages = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => {
      if (d.startups?.stage) set.add(d.startups.stage);
    });
    return Array.from(set).sort();
  }, [deals]);

  const filtered = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch =
        !search ||
        deal.title.toLowerCase().includes(search.toLowerCase()) ||
        (deal.startups?.company_name &&
          deal.startups.company_name.toLowerCase().includes(search.toLowerCase())) ||
        (deal.startups?.industry &&
          deal.startups.industry.toLowerCase().includes(search.toLowerCase()));
      const matchesIndustry =
        industryFilter === "all" || deal.startups?.industry === industryFilter;
      const matchesStage =
        stageFilter === "all" || deal.startups?.stage === stageFilter;
      return matchesSearch && matchesIndustry && matchesStage;
    });
  }, [deals, search, industryFilter, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function hasExpressedInterest(fundingRequestId: string) {
    return existingInterests.some(
      (i) => i.funding_request_id === fundingRequestId
    );
  }

  function getInterestStatus(fundingRequestId: string) {
    const interest = existingInterests.find(
      (i) => i.funding_request_id === fundingRequestId
    );
    return interest?.status;
  }

  function openInterestDialog(deal: Deal) {
    setSelectedDeal(deal);
    form.reset();
    setInterestDialogOpen(true);
  }

  async function onSubmit(values: InterestFormValues) {
    if (!selectedDeal || !investorId) {
      toast.error("Missing required information");
      return;
    }
    setIsSubmitting(true);
    const result = await expressInterest({
      investorId,
      fundingRequestId: selectedDeal.id,
      proposedAmount: parseFloat(values.proposedAmount),
      proposedTerms: values.proposedTerms,
      notes: values.notes || "",
    });
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Interest expressed successfully");
      setInterestDialogOpen(false);
      setSelectedDeal(null);
      router.refresh();
    }
  }

  function formatAmount(value: number | null) {
    if (!value) return "—";
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Deals</h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse anonymized funding opportunities and express your interest.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-[#0A0F1C] border-slate-800/60 card-glow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search by title, company, or industry..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-black border-slate-800/60 text-white placeholder:text-slate-600"
              />
            </div>
            <Select
              value={industryFilter}
              onValueChange={(v) => {
                setIndustryFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] bg-black border-slate-800/60 text-white">
                <Factory size={14} className="mr-2 text-slate-500" />
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1C] border-slate-800/60 text-white">
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={stageFilter}
              onValueChange={(v) => {
                setStageFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] bg-black border-slate-800/60 text-white">
                <Rocket size={14} className="mr-2 text-slate-500" />
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1C] border-slate-800/60 text-white">
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(industryFilter !== "all" || stageFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIndustryFilter("all");
                  setStageFilter("all");
                  setCurrentPage(1);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={14} className="mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#0A0F1C] border-slate-800/60 card-glow overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-medium">Title</TableHead>
                  <TableHead className="text-slate-400 font-medium">Industry</TableHead>
                  <TableHead className="text-slate-400 font-medium">Stage</TableHead>
                  <TableHead className="text-slate-400 font-medium">Amount</TableHead>
                  <TableHead className="text-slate-400 font-medium">Equity</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-slate-800/60">
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <Briefcase size={32} className="mx-auto mb-3 text-slate-600" />
                      <p>No live deals found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((deal) => {
                    const interestStatus = getInterestStatus(deal.id);
                    const alreadyExpressed = hasExpressedInterest(deal.id);
                    return (
                      <TableRow
                        key={deal.id}
                        className="border-slate-800/60 hover:bg-white/[0.02]"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                              <Briefcase size={14} className="text-[#C9A961]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {deal.title}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {deal.startups?.company_name || "Anonymous"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Factory size={14} className="text-slate-500 shrink-0" />
                            <span className="text-sm text-slate-400">
                              {deal.startups?.industry || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Rocket size={14} className="text-slate-500 shrink-0" />
                            <span className="text-sm text-slate-400">
                              {deal.startups?.stage || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-slate-500 shrink-0" />
                            <span className="text-sm text-slate-300">
                              {formatAmount(deal.amount_requested)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Percent size={14} className="text-slate-500 shrink-0" />
                            <span className="text-sm text-slate-300">
                              {deal.equity_offered ? `${deal.equity_offered}%` : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium capitalize"
                          >
                            {deal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {alreadyExpressed ? (
                            <Badge
                              variant="outline"
                              className={`${interestStatusColor(interestStatus || "")} font-medium capitalize`}
                            >
                              {interestStatus}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                              onClick={() => openInterestDialog(deal)}
                            >
                              <Heart size={14} className="mr-1" />
                              Express Interest
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
              <p className="text-xs text-slate-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <Pagination className="mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Express Interest Dialog */}
      <Dialog open={interestDialogOpen} onOpenChange={setInterestDialogOpen}>
        <DialogContent className="bg-[#0A0F1C] border-slate-800/60 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Express Interest</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedDeal
                ? `Propose your terms for "${selectedDeal.title}"`
                : "Propose your investment terms"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <FormField
                control={form.control}
                name="proposedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Proposed Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 500000"
                          className="pl-9 bg-black border-slate-800/60 text-white placeholder:text-slate-600"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proposedTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Proposed Terms</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your proposed investment terms..."
                        className="bg-black border-slate-800/60 text-white placeholder:text-slate-600 min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes or questions..."
                        className="bg-black border-slate-800/60 text-white placeholder:text-slate-600 min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 text-white hover:bg-white/5"
                  onClick={() => setInterestDialogOpen(false)}
                >
                  <X size={16} className="mr-1" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Interest"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function interestStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "expressed":
      return "bg-[#4F5BFF]/10 text-[#4F5BFF] border-[#4F5BFF]/20";
    case "reviewing":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "approved":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "rejected":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "converted":
      return "bg-[#C9A961]/10 text-[#C9A961] border-[#C9A961]/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}
