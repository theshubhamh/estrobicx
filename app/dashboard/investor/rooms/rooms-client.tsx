"use client";

import { useState, useMemo } from "react";
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
  DoorOpen,
  Search,
  Building2,
  DollarSign,
  Calendar,
  ArrowUpRight,
  X,
} from "lucide-react";

interface DealRoom {
  id: string;
  name: string;
  status: string;
  created_at: string;
  funding_requests?: {
    id: string;
    title: string | null;
  } | null;
  startups?: {
    id: string;
    company_name: string | null;
  } | null;
}

interface RoomsClientProps {
  dealRooms: DealRoom[];
}

const ITEMS_PER_PAGE = 10;

export default function RoomsClient({ dealRooms }: RoomsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailRoom, setDetailRoom] = useState<DealRoom | null>(null);

  const filtered = useMemo(() => {
    return dealRooms.filter((room) => {
      const matchesSearch =
        !search ||
        room.name.toLowerCase().includes(search.toLowerCase()) ||
        (room.startups?.company_name &&
          room.startups.company_name.toLowerCase().includes(search.toLowerCase())) ||
        (room.funding_requests?.title &&
          room.funding_requests.title.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" || room.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dealRooms, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    active: dealRooms.filter((r) => r.status === "active").length,
    closed: dealRooms.filter((r) => r.status === "closed").length,
    on_hold: dealRooms.filter((r) => r.status === "on_hold").length,
    total: dealRooms.length,
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deal Rooms</h1>
          <p className="text-slate-400 text-sm mt-1">
            View and manage your deal rooms.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { key: "active", label: "Active", color: "emerald" },
          { key: "on_hold", label: "On Hold", color: "amber" },
          { key: "closed", label: "Closed", color: "gray" },
          { key: "total", label: "Total", color: "indigo" },
        ] as const).map((stat) => {
          const count = stats[stat.key];
          const colorMap: Record<string, string> = {
            emerald: "bg-emerald-500/10 text-emerald-400",
            amber: "bg-amber-500/10 text-amber-400",
            gray: "bg-slate-500/10 text-slate-400",
            indigo: "bg-[#4F5BFF]/10 text-[#4F5BFF]",
          };
          return (
            <Card
              key={stat.key}
              className="bg-[#0A0F1C] border-slate-800/60 card-glow cursor-pointer"
              onClick={() => {
                setStatusFilter(stat.key === "total" ? "all" : stat.key);
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
                placeholder="Search by room name, company, or funding request..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 bg-black border-slate-800/60 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "active", "on_hold", "closed"] as const).map((s) => (
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
                  {s === "all" ? "All" : s.replace("_", " ")}
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
                  <TableHead className="text-slate-400 font-medium">Room Name</TableHead>
                  <TableHead className="text-slate-400 font-medium">Company</TableHead>
                  <TableHead className="text-slate-400 font-medium">Funding</TableHead>
                  <TableHead className="text-slate-400 font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 font-medium">Created</TableHead>
                  <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-slate-800/60">
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <DoorOpen size={32} className="mx-auto mb-3 text-slate-600" />
                      <p>No deal rooms found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((room) => (
                    <TableRow
                      key={room.id}
                      className="border-slate-800/60 hover:bg-white/[0.02]"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#C9A961]/10 flex items-center justify-center shrink-0">
                            <DoorOpen size={14} className="text-[#C9A961]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {room.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {room.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-slate-500 shrink-0" />
                          <span className="text-sm text-slate-400">
                            {room.startups?.company_name || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-slate-500 shrink-0" />
                          <span className="text-sm text-slate-400">
                            {room.funding_requests?.title || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${roomStatusColor(room.status)} font-medium capitalize`}
                        >
                          {room.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-500 shrink-0" />
                          {new Date(room.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-[#4F5BFF] text-white hover:bg-[#4F5BFF]/90"
                          onClick={() => setDetailRoom(room)}
                        >
                          <DoorOpen size={14} className="mr-1" />
                          Enter Room
                        </Button>
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

      {/* Room Detail Dialog */}
      <Dialog open={!!detailRoom} onOpenChange={() => setDetailRoom(null)}>
        <DialogContent className="bg-[#0A0F1C] border-slate-800/60 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{detailRoom?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Deal room details and information.
            </DialogDescription>
          </DialogHeader>
          {detailRoom && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#C9A961]/10 flex items-center justify-center">
                  <DoorOpen size={24} className="text-[#C9A961]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{detailRoom.name}</p>
                  <Badge
                    variant="outline"
                    className={`${roomStatusColor(detailRoom.status)} font-medium capitalize mt-1`}
                  >
                    {detailRoom.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={Building2} label="Company" value={detailRoom.startups?.company_name || "—"} />
                <InfoItem icon={DollarSign} label="Funding Request" value={detailRoom.funding_requests?.title || "—"} />
                <InfoItem icon={Calendar} label="Created" value={new Date(detailRoom.created_at).toLocaleDateString()} />
                <InfoItem icon={ArrowUpRight} label="Room ID" value={detailRoom.id} />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-slate-700 text-white hover:bg-white/5"
              onClick={() => setDetailRoom(null)}
            >
              <X size={16} className="mr-1" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function roomStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "closed":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    case "on_hold":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
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
      <Icon size={14} className="text-slate-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}
