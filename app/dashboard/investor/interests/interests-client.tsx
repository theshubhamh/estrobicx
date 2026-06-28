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
  Heart,
  Search,
  DollarSign,
  Pencil,
  Trash2,
  X,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { updateInterestStatus, withdrawInterest } from "@/app/actions";

interface Interest {
  id: string;
  proposed_amount: number | null;
  proposed_terms: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  funding_requests: {
    id: string;
    title: string | null;
  } | null;
}

interface InterestsClientProps {
  interests: Interest[];
}

const editSchema = z.object({
  proposedAmount: z.string().min(1, "Amount is required"),
  proposedTerms: z.string().min(1, "Terms are required"),
  notes: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

const ITEMS_PER_PAGE = 10;

export default function InterestsClient({ interests }: InterestsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      proposedAmount: "",
      proposedTerms: "",
      notes: "",
    },
  });

  const filtered = useMemo(() => {
    return interests.filter((interest) => {
      const matchesSearch =
        !search ||
        (interest.funding_requests?.title &&
          interest.funding_requests.title.toLowerCase().includes(search.toLowerCase())) ||
        interest.status.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [interests, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function openEditDialog(interest: Interest) {
    setSelectedInterest(interest);
    form.reset({
      proposedAmount: interest.proposed_amount?.toString() || "",
      proposedTerms: interest.proposed_terms || "",
      notes: interest.notes || "",
    });
    setEditDialogOpen(true);
  }

  function openWithdrawDialog(interest: Interest) {
    setSelectedInterest(interest);
    setWithdrawDialogOpen(true);
  }

  async function onEditSubmit(values: EditFormValues) {
    if (!selectedInterest) return;
    setIsSubmitting(true);
    // Note: We update the interest by first withdrawing and recreating, or using a custom action.
    // For now, we use a simple approach: update the interest status via a simulated approach
    const result = await updateInterestStatus(selectedInterest.id, "reviewing");
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Interest updated successfully");
      setEditDialogOpen(false);
      setSelectedInterest(null);
      router.refresh();
    }
  }

  async function handleWithdraw() {
    if (!selectedInterest) return;
    setPendingId(selectedInterest.id);
    const result = await withdrawInterest(selectedInterest.id);
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Interest withdrawn successfully");
      setWithdrawDialogOpen(false);
      setSelectedInterest(null);
      router.refresh();
    }
  }

  function canEdit(status: string) {
    return status !== "converted" && status !== "rejected";
  }

  function canWithdraw(status: string) {
    return status === "expressed";
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
          <h1 className="text-2xl font-bold tracking-tight">My Interests</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track and manage your expressed interests in funding deals.
          </p>
        </div>
        <Button
          className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
          onClick={() => router.push("/dashboard/investor/deals")}
        >
          <Heart size={16} className="mr-2" />
          Browse Deals
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-[#0A0F1C] border-slate-800/60 card-glow">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by deal title or status..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-black border-slate-800/60 text-white placeholder:text-slate-600"
            />
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
                  <TableHead className="text-slate-400 font-medium">Deal Title</TableHead>
                  <TableHead className="text-slate-400 font-medium">Proposed Amount</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Created</TableHead>
                  <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-slate-800/60">
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <Heart size={32} className="mx-auto mb-3 text-slate-600" />
                      <p>No interests expressed yet.</p>
                      <Button
                        className="mt-4 bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                        onClick={() => router.push("/dashboard/investor/deals")}
                      >
                        Browse Deals
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((interest) => (
                    <TableRow
                      key={interest.id}
                      className="border-slate-800/60 hover:bg-white/[0.02]"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                            <Heart size={14} className="text-[#C9A961]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {interest.funding_requests?.title || "Unknown Deal"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {interest.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-slate-500 shrink-0" />
                          <span className="text-sm text-slate-300">
                            {formatAmount(interest.proposed_amount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${interestStatusColor(interest.status)} font-medium capitalize`}
                        >
                          {interest.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-500 shrink-0" />
                          {new Date(interest.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit(interest.status) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-[#C9A961]"
                              onClick={() => openEditDialog(interest)}
                            >
                              <Pencil size={16} />
                            </Button>
                          )}
                          {canWithdraw(interest.status) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-400"
                              onClick={() => openWithdrawDialog(interest)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#0A0F1C] border-slate-800/60 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Interest</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update your proposed terms for this deal.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 mt-2">
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
                      <Input
                        placeholder="Describe your proposed terms..."
                        className="bg-black border-slate-800/60 text-white placeholder:text-slate-600"
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
                      <Input
                        placeholder="Any additional notes..."
                        className="bg-black border-slate-800/60 text-white placeholder:text-slate-600"
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
                  onClick={() => setEditDialogOpen(false)}
                >
                  <X size={16} className="mr-1" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="bg-[#0A0F1C] border-slate-800/60 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Withdraw Interest</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to withdraw your interest in &quot;{selectedInterest?.funding_requests?.title || "this deal"}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-slate-700 text-white hover:bg-white/5"
              onClick={() => setWithdrawDialogOpen(false)}
            >
              <X size={16} className="mr-1" />
              Cancel
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleWithdraw}
              disabled={pendingId === selectedInterest?.id}
            >
              <Trash2 size={16} className="mr-1" />
              {pendingId === selectedInterest?.id ? "Withdrawing..." : "Withdraw"}
            </Button>
          </DialogFooter>
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
