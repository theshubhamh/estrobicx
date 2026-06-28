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
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  MoreHorizontal,
  ChevronDown,
  HelpCircle,
  Building2,
  Mail,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { updateStartupStatus, createClarification } from "@/app/actions";

interface StartupProfile {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface Startup {
  id: string;
  user_id: string;
  company_name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  founded_year: number | null;
  website: string | null;
  linkedin_url: string | null;
  valuation: number | null;
  revenue_last_year: number | null;
  funding_raised_to_date: number | null;
  team_size: number | null;
  headquarters: string | null;
  pitch_deck_url: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
  updated_at: string;
  profiles?: StartupProfile | null;
}

interface StartupsClientProps {
  startups: Startup[];
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "amber", icon: null },
  approved: { label: "Approved", color: "emerald", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "red", icon: XCircle },
  suspended: { label: "Suspended", color: "gray", icon: Ban },
} as const;

const STATUS_COLORS: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const ITEMS_PER_PAGE = 10;

export default function StartupsClient({ startups }: StartupsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [detailStartup, setDetailStartup] = useState<Startup | null>(null);
  const [clarificationModal, setClarificationModal] = useState<Startup | null>(null);
  const [clarificationText, setClarificationText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return startups.filter((s) => {
      const matchesSearch =
        !search ||
        s.company_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.industry && s.industry.toLowerCase().includes(search.toLowerCase())) ||
        (s.profiles?.email && s.profiles.email.toLowerCase().includes(search.toLowerCase())) ||
        (s.profiles?.full_name && s.profiles.full_name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [startups, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const allSelectedOnPage =
    paginated.length > 0 && paginated.every((s) => selectedIds.has(s.id));

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (allSelectedOnPage) {
      const next = new Set(selectedIds);
      paginated.forEach((s) => next.delete(s.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginated.forEach((s) => next.add(s.id));
      setSelectedIds(next);
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleStatusChange(id: string, status: string) {
    setPendingId(id);
    const result = await updateStartupStatus(id, status);
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Startup ${status}`);
      router.refresh();
    }
  }

  async function handleBulkStatus(status: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setPendingId("bulk");
    for (const id of ids) {
      await updateStartupStatus(id, status);
    }
    setPendingId(null);
    toast.success(`${ids.length} startups updated`);
    setSelectedIds(new Set());
    router.refresh();
  }

  async function handleClarificationSubmit() {
    if (!clarificationModal || !clarificationText.trim()) return;
    setPendingId("clarification");
    const result = await createClarification(clarificationModal.id, clarificationText.trim());
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Clarification request sent");
      setClarificationModal(null);
      setClarificationText("");
      router.refresh();
    }
  }

  function StatusBadge({ status }: { status: Startup["status"] }) {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge
        variant="outline"
        className={`${STATUS_COLORS[config.color]} font-medium capitalize`}
      >
        {Icon && <Icon size={12} className="mr-1" />}
        {config.label}
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Startups</h1>
        <p className="text-gray-400 text-sm mt-1">
          Review and manage startup applications.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["pending", "approved", "rejected", "suspended"] as const).map((s) => {
          const count = startups.filter((st) => st.status === s).length;
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
                placeholder="Search by name, industry, email..."
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
                  <Filter size={14} className="mr-2 text-gray-500" />
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
            <CheckCircle2 size={14} className="mr-1" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => handleBulkStatus("rejected")}
            disabled={isPending || pendingId === "bulk"}
          >
            <XCircle size={14} className="mr-1" />
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
                  <TableHead className="text-gray-400 font-medium">Company</TableHead>
                  <TableHead className="text-gray-400 font-medium">Industry</TableHead>
                  <TableHead className="text-gray-400 font-medium">Stage</TableHead>
                  <TableHead className="text-gray-400 font-medium">Status</TableHead>
                  <TableHead className="text-gray-400 font-medium">Date</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <Building2 size={32} className="mx-auto mb-3 text-gray-600" />
                      <p>No startups found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((startup) => (
                    <TableRow
                      key={startup.id}
                      className="border-white/5 hover:bg-white/[0.02]"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(startup.id)}
                          onChange={() => toggleSelect(startup.id)}
                          className="rounded border-white/20 bg-black accent-[#C9A961]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                            <Building2 size={14} className="text-[#C9A961]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {startup.company_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {startup.profiles?.full_name || startup.profiles?.email || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {startup.industry || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {startup.stage || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={startup.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {new Date(startup.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            onClick={() => setDetailStartup(startup)}
                          >
                            <Eye size={16} />
                          </Button>
                          {startup.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                onClick={() => handleStatusChange(startup.id, "approved")}
                                disabled={pendingId === startup.id}
                              >
                                <CheckCircle2 size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => handleStatusChange(startup.id, "rejected")}
                                disabled={pendingId === startup.id}
                              >
                                <XCircle size={16} />
                              </Button>
                            </>
                          )}
                          {startup.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                              onClick={() => handleStatusChange(startup.id, "suspended")}
                              disabled={pendingId === startup.id}
                            >
                              <Ban size={16} />
                            </Button>
                          )}
                          {(startup.status === "rejected" || startup.status === "suspended") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handleStatusChange(startup.id, "approved")}
                              disabled={pendingId === startup.id}
                            >
                              <CheckCircle2 size={16} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-white"
                            onClick={() => setClarificationModal(startup)}
                          >
                            <HelpCircle size={16} />
                          </Button>
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
      <Dialog open={!!detailStartup} onOpenChange={() => setDetailStartup(null)}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{detailStartup?.company_name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Startup details and profile information.
            </DialogDescription>
          </DialogHeader>
          {detailStartup && (
            <div className="space-y-6 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#C9A961]/10 flex items-center justify-center">
                  <Building2 size={24} className="text-[#C9A961]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{detailStartup.company_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={detailStartup.status} />
                    <span className="text-xs text-gray-500">
                      {detailStartup.stage ? `${detailStartup.stage} • ` : ""}
                      {detailStartup.industry || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={Mail} label="Email" value={detailStartup.profiles?.email || "—"} />
                <InfoItem icon={Users} label="Contact" value={detailStartup.profiles?.full_name || "—"} />
                <InfoItem icon={MapPin} label="Headquarters" value={detailStartup.headquarters || "—"} />
                <InfoItem icon={Calendar} label="Founded" value={detailStartup.founded_year?.toString() || "—"} />
                <InfoItem icon={Users} label="Team Size" value={detailStartup.team_size?.toString() || "—"} />
                <InfoItem icon={DollarSign} label="Valuation" value={detailStartup.valuation ? `$${detailStartup.valuation.toLocaleString()}` : "—"} />
                <InfoItem icon={DollarSign} label="Revenue (Last Year)" value={detailStartup.revenue_last_year ? `$${detailStartup.revenue_last_year.toLocaleString()}` : "—"} />
                <InfoItem icon={DollarSign} label="Funding Raised" value={detailStartup.funding_raised_to_date ? `$${detailStartup.funding_raised_to_date.toLocaleString()}` : "—"} />
              </div>

              {detailStartup.description && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{detailStartup.description}</p>
                </div>
              )}

              {(detailStartup.website || detailStartup.linkedin_url) && (
                <div className="flex gap-3">
                  {detailStartup.website && (
                    <a
                      href={detailStartup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-[#C9A961] hover:underline"
                    >
                      <Globe size={14} />
                      Website
                      <ArrowUpRight size={12} />
                    </a>
                  )}
                  {detailStartup.linkedin_url && (
                    <a
                      href={detailStartup.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-[#C9A961] hover:underline"
                    >
                      <Globe size={14} />
                      LinkedIn
                      <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500">
                Submitted on {new Date(detailStartup.created_at).toLocaleString()}
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setDetailStartup(null)}
            >
              Close
            </Button>
            {detailStartup && detailStartup.status === "pending" && (
              <>
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                  onClick={() => {
                    setDetailStartup(null);
                    handleStatusChange(detailStartup.id, "approved");
                  }}
                >
                  <CheckCircle2 size={16} className="mr-1" />
                  Approve
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-500"
                  onClick={() => {
                    setDetailStartup(null);
                    handleStatusChange(detailStartup.id, "rejected");
                  }}
                >
                  <XCircle size={16} className="mr-1" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clarification Modal */}
      <Dialog open={!!clarificationModal} onOpenChange={() => setClarificationModal(null)}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Request Clarification</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send a clarification request to {clarificationModal?.company_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <textarea
              value={clarificationText}
              onChange={(e) => setClarificationText(e.target.value)}
              placeholder="Enter your question or clarification request..."
              rows={4}
              className="w-full rounded-md bg-black border border-white/10 p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A961]/50 resize-none"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => {
                setClarificationModal(null);
                setClarificationText("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
              onClick={handleClarificationSubmit}
              disabled={!clarificationText.trim() || pendingId === "clarification"}
            >
              <HelpCircle size={16} className="mr-1" />
              Send Request
            </Button>
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
