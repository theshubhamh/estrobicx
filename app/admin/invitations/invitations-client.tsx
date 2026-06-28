"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Copy,
  CheckCircle2,
  XCircle,
  Ban,
  Mail,
  Building2,
  Clock,
  User,
  Link,
  Send,
  Tag,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createInvitation } from "@/app/actions";

interface Invitation {
  id: string;
  token: string;
  email: string;
  firm_name: string | null;
  investment_focus: string[] | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  invited_by: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
  invited_by_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface InvitationsClientProps {
  invitations: Invitation[];
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "amber", icon: Clock },
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

const INVESTMENT_FOCUS_OPTIONS = [
  "AI / Machine Learning",
  "Biotech",
  "Clean Energy",
  "Consumer",
  "Crypto / Web3",
  "Enterprise SaaS",
  "Fintech",
  "Gaming",
  "Healthcare",
  "Hardware",
  "Marketplaces",
  "Mobility",
  "Real Estate",
  "Space",
  "Other",
];

const ITEMS_PER_PAGE = 10;

export default function InvitationsClient({ invitations }: InvitationsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createFirmName, setCreateFirmName] = useState("");
  const [createFocus, setCreateFocus] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return invitations.filter((inv) => {
      const matchesSearch =
        !search ||
        inv.email.toLowerCase().includes(search.toLowerCase()) ||
        (inv.firm_name && inv.firm_name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invitations, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function toggleFocus(focus: string) {
    setCreateFocus((prev) =>
      prev.includes(focus) ? prev.filter((f) => f !== focus) : [...prev, focus]
    );
  }

  async function handleCreate() {
    if (!createEmail.trim() || !createFirmName.trim()) {
      toast.error("Email and firm name are required");
      return;
    }
    setCreateLoading(true);
    const result = await createInvitation(createEmail.trim(), createFirmName.trim(), createFocus);
    setCreateLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Invitation created successfully");
      setCreateOpen(false);
      setCreateEmail("");
      setCreateFirmName("");
      setCreateFocus([]);
      router.refresh();
    }
  }

  function handleCopyLink(token: string, id: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date();
  }

  function StatusBadge({ status }: { status: Invitation["status"] }) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invitations</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage investor invitations and invite links.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
        >
          <Plus size={16} className="mr-2" />
          Create Invitation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["pending", "approved", "rejected", "suspended"] as const).map((s) => {
          const count = invitations.filter((inv) => inv.status === s).length;
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
                placeholder="Search by email or firm name..."
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

      {/* Table */}
      <Card className="bg-[#0A0F1C] border-white/5 card-glow overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-medium">Email</TableHead>
                  <TableHead className="text-gray-400 font-medium">Firm Name</TableHead>
                  <TableHead className="text-gray-400 font-medium">Investment Focus</TableHead>
                  <TableHead className="text-gray-400 font-medium">Status</TableHead>
                  <TableHead className="text-gray-400 font-medium">Expires</TableHead>
                  <TableHead className="text-gray-400 font-medium">Created By</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <Mail size={32} className="mx-auto mb-3 text-gray-600" />
                      <p>No invitations found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="border-white/5 hover:bg-white/[0.02]"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-500" />
                          <span className="text-sm text-white">{inv.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-gray-500" />
                          <span className="text-sm text-white">
                            {inv.firm_name || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {inv.investment_focus && inv.investment_focus.length > 0 ? (
                            inv.investment_focus.slice(0, 3).map((focus) => (
                              <Badge
                                key={focus}
                                variant="outline"
                                className="bg-[#4F5BFF]/10 text-[#4F5BFF] border-[#4F5BFF]/20 text-[10px]"
                              >
                                {focus}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">—</span>
                          )}
                          {inv.investment_focus && inv.investment_focus.length > 3 && (
                            <Badge
                              variant="outline"
                              className="bg-gray-500/10 text-gray-400 border-gray-500/20 text-[10px]"
                            >
                              +{inv.investment_focus.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} />
                        {inv.used_at && (
                          <Badge
                            variant="outline"
                            className="bg-[#4F5BFF]/10 text-[#4F5BFF] border-[#4F5BFF]/20 text-[10px] ml-2"
                          >
                            Used
                          </Badge>
                        )}
                        {isExpired(inv.expires_at) && !inv.used_at && (
                          <Badge
                            variant="outline"
                            className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] ml-2"
                          >
                            Expired
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-400">
                            {formatDate(inv.expires_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-400">
                            {inv.invited_by_profile?.full_name || inv.invited_by_profile?.email || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#C9A961]/20 text-[#C9A961] hover:bg-[#C9A961]/10 hover:text-[#C9A961]"
                            onClick={() => handleCopyLink(inv.token, inv.id)}
                          >
                            {copiedId === inv.id ? (
                              <>
                                <Check size={14} className="mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Link size={14} className="mr-1" />
                                Copy Link
                              </>
                            )}
                          </Button>
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
            Showing {paginated.length} of {filtered.length} invitations
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

      {/* Create Invitation Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Invitation</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send an invitation to an investor to join the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-gray-500">Email</Label>
              <Input
                type="email"
                placeholder="investor@firm.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                className="bg-black border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-gray-500">Firm Name</Label>
              <Input
                placeholder="Acme Ventures"
                value={createFirmName}
                onChange={(e) => setCreateFirmName(e.target.value)}
                className="bg-black border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-gray-500">
                Investment Focus
              </Label>
              <div className="flex flex-wrap gap-2">
                {INVESTMENT_FOCUS_OPTIONS.map((focus) => {
                  const selected = createFocus.includes(focus);
                  return (
                    <button
                      key={focus}
                      type="button"
                      onClick={() => toggleFocus(focus)}
                      className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                        selected
                          ? "bg-[#C9A961]/20 text-[#C9A961] border-[#C9A961]/40"
                          : "bg-black text-gray-400 border-white/10 hover:border-white/20"
                      }`}
                    >
                      {selected && <Check size={10} className="inline mr-1" />}
                      {focus}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-white/10 text-gray-400 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createLoading}
              className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
            >
              {createLoading ? (
                <>
                  <Send size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Create Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
