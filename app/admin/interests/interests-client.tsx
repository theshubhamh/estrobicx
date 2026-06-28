"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Heart,
  Search,
  DollarSign,
  Check,
  X,
  DoorOpen,
  User,
  Building2,
  Calendar,
  Plus,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { updateInterestStatus, createDealRoom } from "@/app/actions";

interface Investor {
  id: string;
  firm_name: string | null;
  full_name: string | null;
}

interface FundingRequest {
  id: string;
  title: string | null;
  startup_id: string | null;
}

interface Startup {
  id: string;
  company_name: string | null;
}

interface Interest {
  id: string;
  proposed_amount: number | null;
  proposed_terms: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  investors: Investor | null;
  funding_requests: FundingRequest | null;
  startups: Startup | null;
}

interface InterestsClientProps {
  interests: Interest[];
  fundingRequests: FundingRequest[];
  startups: Startup[];
  investors: Investor[];
}

const ITEMS_PER_PAGE = 10;

export default function InterestsClient({
  interests,
  fundingRequests,
  startups,
  investors,
}: InterestsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [isPending, setIsPending] = useState<string | null>(null);

  const [createName, setCreateName] = useState("");
  const [createFundingId, setCreateFundingId] = useState("");
  const [createStartupId, setCreateStartupId] = useState("");
  const [createInvestorId, setCreateInvestorId] = useState("");

  const filtered = useMemo(() => {
    return interests.filter((interest) => {
      const matchesSearch =
        !search ||
        (interest.investors?.firm_name &&
          interest.investors.firm_name.toLowerCase().includes(search.toLowerCase())) ||
        (interest.investors?.full_name &&
          interest.investors.full_name.toLowerCase().includes(search.toLowerCase())) ||
        (interest.funding_requests?.title &&
          interest.funding_requests.title.toLowerCase().includes(search.toLowerCase())) ||
        (interest.startups?.company_name &&
          interest.startups.company_name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" || interest.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [interests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    expressed: interests.filter((i) => i.status === "expressed").length,
    reviewing: interests.filter((i) => i.status === "reviewing").length,
    approved: interests.filter((i) => i.status === "approved").length,
    rejected: interests.filter((i) => i.status === "rejected").length,
    converted: interests.filter((i) => i.status === "converted").length,
  };

  async function handleApprove(id: string) {
    setIsPending(`approve-${id}`);
    const result = await updateInterestStatus(id, "approved");
    setIsPending(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Interest approved");
      router.refresh();
    }
  }

  async function handleReject(id: string) {
    setIsPending(`reject-${id}`);
    const result = await updateInterestStatus(id, "rejected");
    setIsPending(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Interest rejected");
      router.refresh();
    }
  }

  function openRoomDialog(interest: Interest) {
    setSelectedInterest(interest);
    setCreateName(
      interest.funding_requests?.title
        ? `Deal Room - ${interest.funding_requests.title}`
        : ""
    );
    setCreateFundingId(interest.funding_requests?.id || "");
    setCreateStartupId(interest.startups?.id || "");
    setCreateInvestorId(interest.investors?.id || "");
    setRoomDialogOpen(true);
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim() || !createFundingId || !createStartupId || !createInvestorId) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsPending("create-room");
    const result = await createDealRoom(
      createName.trim(),
      createFundingId,
      createStartupId,
      createInvestorId
    );
    setIsPending(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Deal room created successfully");
      if (selectedInterest) {
        await updateInterestStatus(selectedInterest.id, "converted");
      }
      setRoomDialogOpen(false);
      setCreateName("");
      setCreateFundingId("");
      setCreateStartupId("");
      setCreateInvestorId("");
      setSelectedInterest(null);
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
          <h1 className="text-2xl font-bold tracking-tight">Investor Interests</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage and approve investor interests expressed in funding deals.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {([
          { key: "expressed", label: "Expressed", color: "#4F5BFF" },
          { key: "reviewing", label: "Reviewing", color: "amber" },
          { key: "approved", label: "Approved", color: "emerald" },
          { key: "rejected", label: "Rejected", color: "red" },
          { key: "converted", label: "Converted", color: "#C9A961" },
        ] as const).map((stat) => {
          const count = stats[stat.key];
          return (
            <Card
              key={stat.key}
              className="bg-[#0A0F1C] border-slate-800/60 card-glow cursor-pointer"
              onClick={() => {
                setStatusFilter(stat.key);
                setCurrentPage(1);
              }}
            >
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-2xl font-mono font-bold text-white mt-1">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="bg-[#0A0F1C] border-slate-800/60 card-glow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search by investor, deal, or company..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-black border-slate-800/60 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-2">
              {([
                "all",
                "expressed",
                "reviewing",
                "approved",
                "rejected",
                "converted",
              ] as const).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  className={
                    statusFilter === s
                      ? "bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                      : "border-slate-700 text-slate-400 hover:text-white hover:bg-white/5"
                  }
                  onClick={() => {
                    setStatusFilter(s);
                    setCurrentPage(1);
                  }}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
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
                  <TableHead className="text-slate-400 font-medium">Investor</TableHead>
                  <TableHead className="text-slate-400 font-medium">Deal</TableHead>
                  <TableHead className="text-slate-400 font-medium">Proposed Amount</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Created</TableHead>
                  <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-slate-800/60">
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <Heart size={32} className="mx-auto mb-3 text-slate-600" />
                      <p>No interests found.</p>
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
                          <div className="w-8 h-8 rounded-lg bg-[#4F5BFF]/10 flex items-center justify-center shrink-0">
                            <User size={14} className="text-[#4F5BFF]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {interest.investors?.firm_name || interest.investors?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {interest.investors?.id?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                            <DollarSign size={14} className="text-[#C9A961]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-slate-300 truncate">
                              {interest.funding_requests?.title || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {interest.startups?.company_name || "—"}
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
                          {interest.status !== "approved" && interest.status !== "converted" && interest.status !== "rejected" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handleApprove(interest.id)}
                              disabled={isPending === `approve-${interest.id}`}
                            >
                              <Check size={14} className="mr-1" />
                              {isPending === `approve-${interest.id}` ? "..." : "Approve"}
                            </Button>
                          )}
                          {interest.status !== "rejected" && interest.status !== "converted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleReject(interest.id)}
                              disabled={isPending === `reject-${interest.id}`}
                            >
                              <X size={14} className="mr-1" />
                              {isPending === `reject-${interest.id}` ? "..." : "Reject"}
                            </Button>
                          )}
                          {interest.status === "approved" && (
                            <Button
                              size="sm"
                              className="h-8 bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                              onClick={() => openRoomDialog(interest)}
                              disabled={isPending === "create-room"}
                            >
                              <Plus size={14} className="mr-1" />
                              Convert to Room
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

      {/* Create Deal Room Dialog */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="bg-[#0A0F1C] border-slate-800/60 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Convert to Deal Room</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a deal room from this approved interest.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRoom} className="space-y-4 mt-2">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Room Name</label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g., Series A - Acme Corp"
                className="bg-black border-slate-800/60 text-white placeholder:text-slate-600"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Funding Request</label>
              <Select value={createFundingId} onValueChange={setCreateFundingId}>
                <SelectTrigger className="bg-black border-slate-800/60 text-white">
                  <SelectValue placeholder="Select funding request" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1C] border-slate-800/60 text-white">
                  {fundingRequests.map((fr) => (
                    <SelectItem key={fr.id} value={fr.id}>
                      {fr.title || fr.id.slice(0, 8)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Startup</label>
              <Select value={createStartupId} onValueChange={setCreateStartupId}>
                <SelectTrigger className="bg-black border-slate-800/60 text-white">
                  <SelectValue placeholder="Select startup" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1C] border-slate-800/60 text-white">
                  {startups.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.company_name || s.id.slice(0, 8)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Investor</label>
              <Select value={createInvestorId} onValueChange={setCreateInvestorId}>
                <SelectTrigger className="bg-black border-slate-800/60 text-white">
                  <SelectValue placeholder="Select investor" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1C] border-slate-800/60 text-white">
                  {investors.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.firm_name || inv.full_name || inv.id.slice(0, 8)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="border-slate-700 text-white hover:bg-white/5"
                onClick={() => setRoomDialogOpen(false)}
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                disabled={isPending === "create-room"}
              >
                <DoorOpen size={16} className="mr-1" />
                {isPending === "create-room" ? "Creating..." : "Create Deal Room"}
              </Button>
            </DialogFooter>
          </form>
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
