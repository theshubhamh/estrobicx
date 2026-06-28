"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DoorOpen,
  Search,
  Plus,
  Eye,
  ArrowUpRight,
  Building2,
  Users,
  DollarSign,
  Calendar,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createDealRoom } from "@/app/actions";

interface FundingRequest {
  id: string;
  title: string | null;
  amount_requested: number | null;
}

interface Startup {
  id: string;
  company_name: string | null;
}

interface Investor {
  id: string;
  firm_name: string | null;
  full_name: string | null;
}

interface DealRoom {
  id: string;
  name: string;
  status: "active" | "closed" | "on_hold";
  created_at: string;
  funding_requests?: FundingRequest | null;
  startups?: Startup | null;
  investors?: Investor | null;
}

interface RoomsClientProps {
  rooms: DealRoom[];
  fundingRequests: { id: string; title: string | null; startup_id: string | null }[];
  startups: Startup[];
  investors: Investor[];
}

const STATUS_CONFIG = {
  active: { label: "Active", color: "emerald" },
  closed: { label: "Closed", color: "gray" },
  on_hold: { label: "On Hold", color: "amber" },
} as const;

const STATUS_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function RoomsClient({ rooms, fundingRequests, startups, investors }: RoomsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [detailRoom, setDetailRoom] = useState<DealRoom | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const itemsPerPage = 10;

  const [formName, setFormName] = useState("");
  const [formFundingId, setFormFundingId] = useState("");
  const [formStartupId, setFormStartupId] = useState("");
  const [formInvestorId, setFormInvestorId] = useState("");

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.startups?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.investors?.firm_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || room.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rooms, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => {
    const active = rooms.filter((r) => r.status === "active").length;
    const closed = rooms.filter((r) => r.status === "closed").length;
    const onHold = rooms.filter((r) => r.status === "on_hold").length;
    return { active, closed, onHold, total: rooms.length };
  }, [rooms]);

  function formatAmount(value: number | null | undefined) {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createDealRoom(formName, formFundingId, formStartupId, formInvestorId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Deal room created successfully");
        setCreateOpen(false);
        setFormName("");
        setFormFundingId("");
        setFormStartupId("");
        setFormInvestorId("");
        router.refresh();
      }
    });
  }

  const availableStartups = useMemo(() => {
    if (!formFundingId) return startups;
    const fr = fundingRequests.find((f) => f.id === formFundingId);
    if (!fr?.startup_id) return startups;
    return startups.filter((s) => s.id === fr.startup_id);
  }, [formFundingId, fundingRequests, startups]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Rooms" value={stats.total} icon={DoorOpen} />
        <StatCard title="Active" value={stats.active} icon={ArrowUpRight} color="emerald" />
        <StatCard title="Closed" value={stats.closed} icon={X} color="gray" />
        <StatCard title="On Hold" value={stats.onHold} icon={Calendar} color="amber" />
      </div>

      {/* Filters + Create */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="input-dark pl-9 h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-44 input-dark h-10">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0F1C] border-white/10">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="btn-primary h-10">
          <Plus size={16} className="mr-2" /> Create Room
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[#0A0F1C] border border-white/5 rounded-lg overflow-hidden card-glow">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 label-style w-12">Room</TableHead>
                <TableHead className="text-gray-400 label-style">Company</TableHead>
                <TableHead className="text-gray-400 label-style">Investor</TableHead>
                <TableHead className="text-gray-400 label-style">Funding</TableHead>
                <TableHead className="text-gray-400 label-style">Status</TableHead>
                <TableHead className="text-gray-400 label-style">Created</TableHead>
                <TableHead className="text-gray-400 label-style w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <DoorOpen size={32} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-sm">No deal rooms found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRooms.map((room) => (
                  <TableRow key={room.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <DoorOpen size={14} className="text-indigo-400" />
                        </div>
                        <p className="text-sm font-medium text-white truncate">{room.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-300">{room.startups?.company_name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-300">{room.investors?.firm_name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-gray-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-400 truncate">{room.funding_requests?.title || "—"}</p>
                          <p className="text-xs text-gray-500">{formatAmount(room.funding_requests?.amount_requested ?? null)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${STATUS_COLORS[STATUS_CONFIG[room.status].color]} font-medium capitalize`}
                      >
                        {STATUS_CONFIG[room.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-400">{new Date(room.created_at).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setDetailRoom(room)} className="text-gray-400 hover:text-white">
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink onClick={() => setCurrentPage(page)} isActive={page === currentPage} className={page === currentPage ? "bg-indigo-500 text-white" : "text-gray-400 hover:text-white cursor-pointer"}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Deal Room</DialogTitle>
            <DialogDescription className="text-gray-400">Create a new deal room for a startup and investor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="label-style text-gray-400">Room Name</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., TechFlow Series A Discussion" className="input-dark" required />
            </div>
            <div className="space-y-2">
              <label className="label-style text-gray-400">Funding Request</label>
              <Select value={formFundingId} onValueChange={setFormFundingId}>
                <SelectTrigger className="input-dark"><SelectValue placeholder="Select funding request" /></SelectTrigger>
                <SelectContent className="bg-[#0A0F1C] border-white/10">
                  {fundingRequests.map((fr) => (
                    <SelectItem key={fr.id} value={fr.id}>{fr.title || "Untitled"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="label-style text-gray-400">Startup</label>
              <Select value={formStartupId} onValueChange={setFormStartupId}>
                <SelectTrigger className="input-dark"><SelectValue placeholder="Select startup" /></SelectTrigger>
                <SelectContent className="bg-[#0A0F1C] border-white/10">
                  {availableStartups.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.company_name || "Untitled"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="label-style text-gray-400">Investor</label>
              <Select value={formInvestorId} onValueChange={setFormInvestorId}>
                <SelectTrigger className="input-dark"><SelectValue placeholder="Select investor" /></SelectTrigger>
                <SelectContent className="bg-[#0A0F1C] border-white/10">
                  {investors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.firm_name || "Untitled"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="btn-outline">Cancel</Button>
              <Button type="submit" disabled={isPending || !formName || !formFundingId || !formStartupId || !formInvestorId} className="btn-primary">
                {isPending ? "Creating..." : "Create Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailRoom} onOpenChange={() => setDetailRoom(null)}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{detailRoom?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <InfoItem icon={Building2} label="Startup" value={detailRoom?.startups?.company_name || "—"} />
            <InfoItem icon={Users} label="Investor" value={detailRoom?.investors?.firm_name || "—"} />
            <InfoItem icon={DollarSign} label="Funding Request" value={detailRoom?.funding_requests?.title || "—"} />
            <InfoItem icon={DollarSign} label="Amount Requested" value={formatAmount(detailRoom?.funding_requests?.amount_requested ?? null)} />
            <InfoItem icon={Calendar} label="Created" value={detailRoom ? new Date(detailRoom.created_at).toLocaleDateString() : "—"} />
            <InfoItem icon={ArrowUpRight} label="Status" value={detailRoom ? STATUS_CONFIG[detailRoom.status].label : "—"} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "gold" }: {
  title: string; value: number; icon: React.ElementType; color?: string;
}) {
  const colorMap: Record<string, string> = {
    gold: "text-[#C9A961]",
    emerald: "text-emerald-400",
    gray: "text-gray-400",
    amber: "text-amber-400",
  };
  return (
    <div className="bg-[#0A0F1C] border border-white/5 rounded-lg p-5 card-glow">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-style text-gray-500 mb-2">{title}</p>
          <p className="text-2xl font-mono font-bold text-white">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon size={20} className={colorMap[color] || "text-[#C9A961]"} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <Icon size={16} className="text-gray-500 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}
