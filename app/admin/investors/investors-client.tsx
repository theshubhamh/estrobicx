"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Users,
  Search,
  Check,
  X,
  Ban,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Building2,
  Mail,
  Calendar,
  Briefcase,
  Globe,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { updateInvestorStatus } from "@/app/actions";

interface InvestorProfile {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface Investor {
  id: string;
  user_id: string;
  firm_name: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  aum: number | null;
  investment_focus: string[] | null;
  preferred_stage: string | null;
  preferred_ticket_size: number | null;
  website: string | null;
  linkedin_url: string | null;
  bio: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
  updated_at: string;
  profiles?: InvestorProfile | null;
}

interface InvestorsClientProps {
  investors: Investor[];
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "amber" },
  approved: { label: "Approved", color: "emerald" },
  rejected: { label: "Rejected", color: "red" },
  suspended: { label: "Suspended", color: "gray" },
} as const;

const STATUS_COLORS: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const ITEMS_PER_PAGE = 10;

export default function InvestorsClient({ investors }: InvestorsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [detailInvestor, setDetailInvestor] = useState<Investor | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return investors.filter((inv) => {
      const matchesSearch =
        !search ||
        (inv.firm_name && inv.firm_name.toLowerCase().includes(search.toLowerCase())) ||
        (inv.full_name && inv.full_name.toLowerCase().includes(search.toLowerCase())) ||
        (inv.profiles?.email && inv.profiles.email.toLowerCase().includes(search.toLowerCase())) ||
        (inv.profiles?.full_name && inv.profiles.full_name.toLowerCase().includes(search.toLowerCase())) ||
        (inv.investment_focus && inv.investment_focus.some((f) => f.toLowerCase().includes(search.toLowerCase())));
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [investors, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const allSelectedOnPage =
    paginated.length > 0 && paginated.every((inv) => selectedIds.has(inv.id));

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (allSelectedOnPage) {
      const next = new Set(selectedIds);
      paginated.forEach((inv) => next.delete(inv.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginated.forEach((inv) => next.add(inv.id));
      setSelectedIds(next);
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleStatusChange(id: string, status: string) {
    setPendingId(id);
    const result = await updateInvestorStatus(id, status);
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Investor ${status}`);
      router.refresh();
    }
  }

  async function handleBulkStatus(status: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setPendingId("bulk");
    for (const id of ids) {
      await updateInvestorStatus(id, status);
    }
    setPendingId(null);
    toast.success(`${ids.length} investors updated`);
    setSelectedIds(new Set());
    router.refresh();
  }

  function StatusBadge({ status }: { status: Investor["status"] }) {
    const config = STATUS_CONFIG[status];
    return (
      <Badge
        variant="outline"
        className={`${STATUS_COLORS[config.color]} font-medium capitalize`}
      >
        {config.label}
      </Badge>
    );
  }

  function formatAUM(value: number | null) {
    if (!value) return "—";
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  }

  function formatTicketSize(value: number | null) {
    if (!value) return "—";
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Investors</h1>
        <p className="text-gray-400 text-sm mt-1">
          Review and manage investor applications.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["pending", "approved", "rejected", "suspended"] as const).map((s) => {
          const count = investors.filter((inv) => inv.status === s).length;
          const config = STATUS_CONFIG[s];
          return (
            <Card
              key={s}
              className="bg-[#0A0F1C] border-white/5 card-glow cursor-pointer"
              onClick={() => {
                setStatusFilter(s);
                setCurrentPage(1);
              }}
            >
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 capitalize">{config.label}</p>
                <p className="text-2xl font-mono font-bold text-white mt-1">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="bg-[#0A0F1C] border-white/5 card-glow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, firm, email, focus..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-9 pr-4 rounded-md bg-black border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A961]/50"
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] bg-black border-white/10 text-white text-sm">
                  <Users size={14} className="mr-2 text-gray-500" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1C] border-white/10 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              {statusFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="text-gray-400 hover:text-white"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-[#0A0F1C] border border-white/5 rounded-lg p-3">
          <span className="text-sm text-white font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            onClick={() => handleBulkStatus("approved")}
            disabled={isPending || pendingId === "bulk"}
          >
            <Check size={14} className="mr-1" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => handleBulkStatus("rejected")}
            disabled={isPending || pendingId === "bulk"}
          >
            <X size={14} className="mr-1" />
            Reject
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-500/20 text-gray-400 hover:bg-gray-500/10 hover:text-gray-300"
            onClick={() => handleBulkStatus("suspended")}
            disabled={isPending || pendingId === "bulk"}
          >
            <Ban size={14} className="mr-1" />
            Suspend
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="bg-[#0A0F1C] border-white/5 card-glow overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={toggleSelectAll}
                      className="rounded border-white/20 bg-black accent-[#C9A961]"
                    />
                  </TableHead>
                  <TableHead className="text-gray-400 font-medium">Name</TableHead>
                  <TableHead className="text-gray-400 font-medium">Firm</TableHead>
                  <TableHead className="text-gray-400 font-medium">Email</TableHead>
                  <TableHead className="text-gray-400 font-medium">Status</TableHead>
                  <TableHead className="text-gray-400 font-medium">AUM</TableHead>
                  <TableHead className="text-gray-400 font-medium">Focus</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <Users size={32} className="mx-auto mb-3 text-gray-600" />
                      <p>No investors found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((investor) => (
                    <TableRow
                      key={investor.id}
                      className="border-white/5 hover:bg-white/[0.02]"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(investor.id)}
                          onChange={() => toggleSelect(investor.id)}
                          className="rounded border-white/20 bg-black accent-[#C9A961]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#4F5BFF]/10 flex items-center justify-center shrink-0">
                            <Users size={14} className="text-[#4F5BFF]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {investor.full_name || investor.profiles?.full_name || "—"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {investor.preferred_stage || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {investor.firm_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {investor.profiles?.email || investor.email || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={investor.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {formatAUM(investor.aum)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        <div className="flex flex-wrap gap-1">
                          {(investor.investment_focus || []).slice(0, 2).map((focus) => (
                            <span
                              key={focus}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[#4F5BFF]/10 text-[#4F5BFF]"
                            >
                              {focus}
                            </span>
                          ))}
                          {(investor.investment_focus || []).length > 2 && (
                            <span className="text-[10px] text-gray-500">
                              +{(investor.investment_focus || []).length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            onClick={() => setDetailInvestor(investor)}
                          >
                            <Eye size={16} />
                          </Button>
                          {investor.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                onClick={() => handleStatusChange(investor.id, "approved")}
                                disabled={pendingId === investor.id}
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => handleStatusChange(investor.id, "rejected")}
                                disabled={pendingId === investor.id}
                              >
                                <X size={16} />
                              </Button>
                            </>
                          )}
                          {investor.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                              onClick={() => handleStatusChange(investor.id, "suspended")}
                              disabled={pendingId === investor.id}
                            >
                              <Ban size={16} />
                            </Button>
                          )}
                          {(investor.status === "rejected" || investor.status === "suspended") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handleStatusChange(investor.id, "approved")}
                              disabled={pendingId === investor.id}
                            >
                              <Check size={16} />
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <p className="text-xs text-gray-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <Pagination className="mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!detailInvestor} onOpenChange={() => setDetailInvestor(null)}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {detailInvestor?.firm_name || "Investor Details"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Full investor profile and application information.
            </DialogDescription>
          </DialogHeader>
          {detailInvestor && (
            <div className="space-y-6 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#4F5BFF]/10 flex items-center justify-center">
                  <Users size={24} className="text-[#4F5BFF]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {detailInvestor.full_name || detailInvestor.profiles?.full_name || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={detailInvestor.status} />
                    <span className="text-xs text-gray-500">
                      {detailInvestor.firm_name || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={Mail} label="Email" value={detailInvestor.profiles?.email || detailInvestor.email || "—"} />
                <InfoItem icon={Users} label="Contact Name" value={detailInvestor.full_name || detailInvestor.profiles?.full_name || "—"} />
                <InfoItem icon={Building2} label="Firm" value={detailInvestor.firm_name || "—"} />
                <InfoItem icon={DollarSign} label="AUM" value={formatAUM(detailInvestor.aum)} />
                <InfoItem icon={Target} label="Preferred Stage" value={detailInvestor.preferred_stage || "—"} />
                <InfoItem icon={DollarSign} label="Preferred Ticket" value={formatTicketSize(detailInvestor.preferred_ticket_size)} />
                <InfoItem icon={Globe} label="Website" value={detailInvestor.website || "—"} />
                <InfoItem icon={Calendar} label="Applied" value={new Date(detailInvestor.created_at).toLocaleDateString()} />
              </div>

              {detailInvestor.investment_focus && detailInvestor.investment_focus.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Investment Focus</p>
                  <div className="flex flex-wrap gap-2">
                    {detailInvestor.investment_focus.map((focus) => (
                      <span
                        key={focus}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-[#4F5BFF]/10 text-[#4F5BFF] border border-[#4F5BFF]/20"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detailInvestor.bio && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Bio</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{detailInvestor.bio}</p>
                </div>
              )}

              <div className="flex gap-3">
                {detailInvestor.website && (
                  <a
                    href={detailInvestor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#C9A961] hover:underline"
                  >
                    <Globe size={14} />
                    Website
                    <ArrowUpRight size={12} />
                  </a>
                )}
                {detailInvestor.linkedin_url && (
                  <a
                    href={detailInvestor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#C9A961] hover:underline"
                  >
                    <Briefcase size={14} />
                    LinkedIn
                    <ArrowUpRight size={12} />
                  </a>
                )}
              </div>

              <div className="text-xs text-gray-500">
                Submitted on {new Date(detailInvestor.created_at).toLocaleString()}
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setDetailInvestor(null)}
            >
              Close
            </Button>
            {detailInvestor && detailInvestor.status === "pending" && (
              <>
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                  onClick={() => {
                    setDetailInvestor(null);
                    handleStatusChange(detailInvestor.id, "approved");
                  }}
                >
                  <Check size={16} className="mr-1" />
                  Approve
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-500"
                  onClick={() => {
                    setDetailInvestor(null);
                    handleStatusChange(detailInvestor.id, "rejected");
                  }}
                >
                  <X size={16} className="mr-1" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-gray-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}
