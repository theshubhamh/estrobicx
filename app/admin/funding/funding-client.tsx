"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Eye,
  CheckCircle2,
  XCircle,
  DollarSign,
  Building2,
  TrendingUp,
  Calendar,
  Clock,
  Loader2,
  ArrowRight,
  Check,
  Flame,
  Banknote,
  Archive,
  Target,
  Users,
  BarChart3,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { updateFundingStatus } from "@/app/actions";

interface FundingRequest {
  id: string;
  startup_id: string;
  title: string;
  description: string | null;
  amount_requested: number;
  amount_approved: number | null;
  equity_offered: number | null;
  use_of_funds: string | null;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "live" | "funded" | "closed";
  admin_notes: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  live_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  startups: {
    id: string;
    company_name: string;
    industry: string | null;
  } | null;
}

interface FundingClientProps {
  fundingRequests: FundingRequest[];
}

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "gray", icon: FileText, step: 1 },
  submitted: { label: "Submitted", color: "blue", icon: CheckCircle2, step: 2 },
  under_review: { label: "Under Review", color: "indigo", icon: Eye, step: 3 },
  approved: { label: "Approved", color: "emerald", icon: CheckCircle2, step: 4 },
  rejected: { label: "Rejected", color: "red", icon: XCircle, step: 0 },
  live: { label: "Live", color: "cyan", icon: Flame, step: 5 },
  funded: { label: "Funded", color: "gold", icon: Banknote, step: 6 },
  closed: { label: "Closed", color: "gray", icon: Archive, step: 7 },
} as const;

const STATUS_COLORS: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  indigo: "bg-[#4F5BFF]/10 text-[#4F5BFF] border-[#4F5BFF]/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  gold: "bg-[#C9A961]/10 text-[#C9A961] border-[#C9A961]/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const STATUS_FLOW: FundingRequest["status"][] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "live",
  "funded",
  "closed",
];

const NEXT_ACTIONS: Record<string, { label: string; status: FundingRequest["status"]; icon: typeof Check; variant: "approve" | "reject" | "primary" | "secondary" }[]> = {
  draft: [],
  submitted: [
    { label: "Under Review", status: "under_review", icon: Eye, variant: "primary" },
    { label: "Reject", status: "rejected", icon: XCircle, variant: "reject" },
  ],
  under_review: [
    { label: "Approve", status: "approved", icon: CheckCircle2, variant: "approve" },
    { label: "Reject", status: "rejected", icon: XCircle, variant: "reject" },
  ],
  approved: [
    { label: "Mark Live", status: "live", icon: Flame, variant: "primary" },
    { label: "Reject", status: "rejected", icon: XCircle, variant: "reject" },
  ],
  live: [
    { label: "Mark Funded", status: "funded", icon: Banknote, variant: "primary" },
    { label: "Close", status: "closed", icon: Archive, variant: "secondary" },
  ],
  funded: [
    { label: "Close", status: "closed", icon: Archive, variant: "secondary" },
  ],
  rejected: [],
  closed: [],
};

const ITEMS_PER_PAGE = 10;

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEquity(value: number | null) {
  if (value === null || value === undefined) return "—";
  return `${value}%`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusPosition(status: FundingRequest["status"]) {
  return STATUS_FLOW.indexOf(status);
}

export default function FundingClient({ fundingRequests }: FundingClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [detailFr, setDetailFr] = useState<FundingRequest | null>(null);

  const [actionFr, setActionFr] = useState<FundingRequest | null>(null);
  const [actionStatus, setActionStatus] = useState<string>("");
  const [actionAmount, setActionAmount] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => {
    return fundingRequests.filter((fr) => {
      const matchesSearch =
        !search ||
        fr.title.toLowerCase().includes(search.toLowerCase()) ||
        (fr.startups?.company_name && fr.startups.company_name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || fr.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [fundingRequests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function openAction(fr: FundingRequest, status: FundingRequest["status"]) {
    setActionFr(fr);
    setActionStatus(status);
    setActionAmount(fr.amount_approved ? String(fr.amount_approved) : String(fr.amount_requested));
  }

  async function handleActionSubmit() {
    if (!actionFr) return;
    setActionLoading(true);
    const amount = actionStatus === "approved" ? parseFloat(actionAmount) : undefined;
    const result = await updateFundingStatus(actionFr.id, actionStatus, amount);
    setActionLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Funding request marked as ${actionStatus}`);
      setActionFr(null);
      setActionStatus("");
      setActionAmount("");
      router.refresh();
    }
  }

  function StatusBadge({ status }: { status: FundingRequest["status"] }) {
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

  function StatusFlow({ status }: { status: FundingRequest["status"] }) {
    const currentPos = getStatusPosition(status);
    if (status === "rejected") {
      return (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
            Rejected
          </Badge>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        {STATUS_FLOW.map((s, i) => {
          if (i > currentPos + 1) return null;
          const config = STATUS_CONFIG[s];
          const isActive = i === currentPos;
          const isPast = i < currentPos;
          return (
            <div key={s} className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full ${
                  isActive
                    ? "bg-[#C9A961]"
                    : isPast
                    ? "bg-emerald-500"
                    : "bg-gray-700"
                }`}
              />
              {i < STATUS_FLOW.length - 1 && i <= currentPos && (
                <div className="w-3 h-px bg-white/10" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Funding Requests</h1>
        <p className="text-gray-400 text-sm mt-1">
          Review and manage startup funding applications.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          "submitted",
          "under_review",
          "approved",
          "live",
        ] as const).map((s) => {
          const count = fundingRequests.filter((fr) => fr.status === s).length;
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
                <p className="text-xs text-gray-500">{config.label}</p>
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
                placeholder="Search by title or company name..."
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
                <SelectTrigger className="w-[160px] bg-black border-white/10 text-white text-sm">
                  <Filter size={14} className="mr-2 text-gray-500" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1C] border-white/10 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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

      {/* Table */}
      <Card className="bg-[#0A0F1C] border-white/5 card-glow overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-medium">Title</TableHead>
                  <TableHead className="text-gray-400 font-medium">Company</TableHead>
                  <TableHead className="text-gray-400 font-medium">Amount</TableHead>
                  <TableHead className="text-gray-400 font-medium">Equity</TableHead>
                  <TableHead className="text-gray-400 font-medium">Status</TableHead>
                  <TableHead className="text-gray-400 font-medium">Submitted</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <DollarSign size={32} className="mx-auto mb-3 text-gray-600" />
                      <p>No funding requests found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((fr) => (
                    <TableRow
                      key={fr.id}
                      className="border-white/5 hover:bg-white/[0.02]"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Target size={14} className="text-gray-500" />
                          <span className="text-sm text-white font-medium">{fr.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-gray-500" />
                          <span className="text-sm text-white">
                            {fr.startups?.company_name || "—"}
                          </span>
                        </div>
                        {fr.startups?.industry && (
                          <span className="text-xs text-gray-500 ml-6">{fr.startups.industry}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-[#C9A961]" />
                          <span className="text-sm text-white font-mono">
                            {formatCurrency(fr.amount_requested)}
                          </span>
                        </div>
                        {fr.amount_approved && (
                          <span className="text-xs text-emerald-400 ml-6">
                            Approved: {formatCurrency(fr.amount_approved)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp size={14} className="text-gray-500" />
                          <span className="text-sm text-white">
                            {formatEquity(fr.equity_offered)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={fr.status} />
                          <StatusFlow status={fr.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-400">
                            {formatDate(fr.submitted_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                            onClick={() => setDetailFr(fr)}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          {NEXT_ACTIONS[fr.status]?.map((action) => {
                            let btnClass = "border-white/10 text-gray-300 hover:bg-white/5 hover:text-white";
                            if (action.variant === "approve") {
                              btnClass = "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300";
                            } else if (action.variant === "reject") {
                              btnClass = "border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300";
                            } else if (action.variant === "primary") {
                              btnClass = "border-[#C9A961]/20 text-[#C9A961] hover:bg-[#C9A961]/10 hover:text-[#C9A961]";
                            }
                            const Icon = action.icon;
                            return (
                              <Button
                                key={action.status}
                                variant="outline"
                                size="sm"
                                className={btnClass}
                                onClick={() => openAction(fr, action.status)}
                              >
                                <Icon size={14} className="mr-1" />
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {paginated.length} of {filtered.length} funding requests
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                        onClick={() => setCurrentPage(page)}
                        isActive={page === currentPage}
                        className={
                          page === currentPage
                            ? "bg-[#C9A961] text-black border-[#C9A961]"
                            : "bg-transparent text-white border-white/10 hover:bg-white/5"
                        }
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis className="text-gray-500" />
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!detailFr} onOpenChange={() => setDetailFr(null)}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{detailFr?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {detailFr?.startups?.company_name}
              {detailFr?.startups?.industry && (
                <span className="ml-2 text-[#4F5BFF]">· {detailFr.startups.industry}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Status bar */}
            <div className="flex items-center gap-3">
              {detailFr && <StatusBadge status={detailFr.status} />}
              <div className="flex items-center gap-1">
                {STATUS_FLOW.map((s, i) => {
                  const currentPos = detailFr ? getStatusPosition(detailFr.status) : -1;
                  const isActive = i === currentPos;
                  const isPast = i < currentPos;
                  if (detailFr?.status === "rejected" && s !== "rejected") return null;
                  return (
                    <div key={s} className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isActive ? "bg-[#C9A961]" : isPast ? "bg-emerald-500" : "bg-gray-700"
                        }`}
                        title={STATUS_CONFIG[s].label}
                      />
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`w-4 h-px ${isPast ? "bg-emerald-500" : "bg-white/10"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-black border-white/5">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <DollarSign size={12} />
                    Amount Requested
                  </p>
                  <p className="text-lg font-mono font-bold text-white mt-1">
                    {formatCurrency(detailFr?.amount_requested || null)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-black border-white/5">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <TrendingUp size={12} />
                    Equity Offered
                  </p>
                  <p className="text-lg font-mono font-bold text-white mt-1">
                    {formatEquity(detailFr?.equity_offered ?? null)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-black border-white/5">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Amount Approved
                  </p>
                  <p className="text-lg font-mono font-bold text-white mt-1">
                    {formatCurrency(detailFr?.amount_approved || null)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {detailFr?.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <FileText size={14} />
                  Description
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed bg-black border border-white/5 rounded-lg p-4">
                  {detailFr.description}
                </p>
              </div>
            )}

            {/* Use of Funds */}
            {detailFr?.use_of_funds && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <BarChart3 size={14} />
                  Use of Funds
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed bg-black border border-white/5 rounded-lg p-4">
                  {detailFr.use_of_funds}
                </p>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Clock size={14} />
                Timeline
              </h3>
              <div className="space-y-2 bg-black border border-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-300">{formatDate(detailFr?.created_at || null)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Submitted</span>
                  <span className="text-gray-300">{formatDate(detailFr?.submitted_at || null)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Approved</span>
                  <span className="text-gray-300">{formatDate(detailFr?.approved_at || null)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Live</span>
                  <span className="text-gray-300">{formatDate(detailFr?.live_at || null)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Closed</span>
                  <span className="text-gray-300">{formatDate(detailFr?.closed_at || null)}</span>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            {detailFr?.admin_notes && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Users size={14} />
                  Admin Notes
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed bg-black border border-white/5 rounded-lg p-4">
                  {detailFr.admin_notes}
                </p>
              </div>
            )}

            {/* Available Actions */}
            {detailFr && NEXT_ACTIONS[detailFr.status]?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {NEXT_ACTIONS[detailFr.status].map((action) => {
                    let btnClass = "border-white/10 text-gray-300 hover:bg-white/5";
                    if (action.variant === "approve") {
                      btnClass = "bg-emerald-500 text-white hover:bg-emerald-500/90 border-transparent";
                    } else if (action.variant === "reject") {
                      btnClass = "bg-red-500 text-white hover:bg-red-500/90 border-transparent";
                    } else if (action.variant === "primary") {
                      btnClass = "bg-[#C9A961] text-black hover:bg-[#C9A961]/90 border-transparent";
                    } else {
                      btnClass = "border-white/10 text-gray-300 hover:bg-white/5";
                    }
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.status}
                        className={btnClass}
                        onClick={() => {
                          setDetailFr(null);
                          openAction(detailFr, action.status);
                        }}
                      >
                        <Icon size={14} className="mr-2" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailFr(null)}
              className="border-white/10 text-gray-400 hover:bg-white/5"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={!!actionFr} onOpenChange={() => setActionFr(null)}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionStatus === "approved" && "Approve Funding Request"}
              {actionStatus === "rejected" && "Reject Funding Request"}
              {actionStatus === "under_review" && "Mark Under Review"}
              {actionStatus === "live" && "Mark as Live"}
              {actionStatus === "funded" && "Mark as Funded"}
              {actionStatus === "closed" && "Close Funding Request"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionFr?.title} — {actionFr?.startups?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current status */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Current status:</span>
              {actionFr && <StatusBadge status={actionFr.status} />}
              <ArrowRight size={14} className="text-gray-500" />
              {actionStatus && (
                <Badge
                  variant="outline"
                  className={`${STATUS_COLORS[STATUS_CONFIG[actionStatus as FundingRequest["status"]].color]} font-medium capitalize`}
                >
                  {STATUS_CONFIG[actionStatus as FundingRequest["status"]].label}
                </Badge>
              )}
            </div>

            {/* Amount approved for approval action */}
            {actionStatus === "approved" && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-500">
                  Amount Approved (USD)
                </Label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    type="number"
                    placeholder="Enter approved amount"
                    value={actionAmount}
                    onChange={(e) => setActionAmount(e.target.value)}
                    className="pl-9 bg-black border-white/10 text-white placeholder:text-gray-600"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Requested: {formatCurrency(actionFr?.amount_requested || null)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionFr(null)}
              className="border-white/10 text-gray-400 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleActionSubmit}
              disabled={actionLoading}
              className={
                actionStatus === "approved"
                  ? "bg-emerald-500 text-white hover:bg-emerald-500/90"
                  : actionStatus === "rejected"
                  ? "bg-red-500 text-white hover:bg-red-500/90"
                  : "bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
              }
            >
              {actionLoading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : actionStatus === "approved" ? (
                <CheckCircle2 size={16} className="mr-2" />
              ) : actionStatus === "rejected" ? (
                <XCircle size={16} className="mr-2" />
              ) : (
                <Check size={16} className="mr-2" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
