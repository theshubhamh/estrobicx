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
  ClipboardList,
  Search,
  Download,
  Calendar,
  User,
  Activity,
  Box,
  FileText,
  ArrowUpRight,
} from "lucide-react";

interface ProfileInfo {
  user_id: string;
  email: string | null;
  full_name: string | null;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles?: ProfileInfo | null;
}

interface AuditClientProps {
  auditLogs: AuditLog[];
}

const ACTION_COLORS: Record<string, string> = {
  startup_status_change: "bg-[#4F5BFF]/10 text-[#4F5BFF] border-[#4F5BFF]/20",
  investor_status_change: "bg-[#4F5BFF]/10 text-[#4F5BFF] border-[#4F5BFF]/20",
  funding_status_change: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  deal_room_created: "bg-[#C9A961]/10 text-[#C9A961] border-[#C9A961]/20",
  document_review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  invitation_created: "bg-[#C9A961]/10 text-[#C9A961] border-[#C9A961]/20",
  clarification_created: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  default: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function AuditClient({ auditLogs }: AuditClientProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const uniqueActions = useMemo(() => {
    const actions = new Set(auditLogs.map((log) => log.action));
    return Array.from(actions).sort();
  }, [auditLogs]);

  const uniqueEntities = useMemo(() => {
    const entities = new Set(auditLogs.map((log) => log.entity_type));
    return Array.from(entities).sort();
  }, [auditLogs]);

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        !search ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
        (log.entity_id && log.entity_id.toLowerCase().includes(search.toLowerCase())) ||
        (log.profiles?.email && log.profiles.email.toLowerCase().includes(search.toLowerCase())) ||
        (log.profiles?.full_name && log.profiles.full_name.toLowerCase().includes(search.toLowerCase()));

      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;

      const logDate = new Date(log.created_at);
      const matchesDateFrom = !dateFrom || logDate >= new Date(dateFrom + "T00:00:00");
      const matchesDateTo = !dateTo || logDate <= new Date(dateTo + "T23:59:59");

      return matchesSearch && matchesAction && matchesEntity && matchesDateFrom && matchesDateTo;
    });
  }, [auditLogs, search, actionFilter, entityFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function getActionColor(action: string) {
    return ACTION_COLORS[action] || ACTION_COLORS.default;
  }

  function formatActionName(action: string) {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function exportToCSV() {
    const headers = ["Date", "User", "User Email", "Action", "Entity Type", "Entity ID", "Details"];
    const rows = filtered.map((log) => {
      const date = new Date(log.created_at).toLocaleString();
      const user = log.profiles?.full_name || log.user_id || "System";
      const email = log.profiles?.email || "";
      const action = formatActionName(log.action);
      const entityType = log.entity_type;
      const entityId = log.entity_id || "";
      const details = log.details ? JSON.stringify(log.details) : "";
      return [date, user, email, action, entityType, entityId, details].map((field) => `"${String(field).replace(/"/g, "\"").replace(/\n/g, " ")}"`);
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-log-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track all platform actions and changes.
          </p>
        </div>
        <Button
          className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
          onClick={exportToCSV}
        >
          <Download size={16} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Logs</p>
            <p className="text-2xl font-mono font-bold text-white mt-1">{auditLogs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Filtered</p>
            <p className="text-2xl font-mono font-bold text-white mt-1">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Unique Actions</p>
            <p className="text-2xl font-mono font-bold text-white mt-1">{uniqueActions.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A0F1C] border-white/5 card-glow">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Entity Types</p>
            <p className="text-2xl font-mono font-bold text-white mt-1">{uniqueEntities.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#0A0F1C] border-white/5 card-glow">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by action, entity, user, ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 pl-9 pr-4 rounded-md bg-black border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A961]/50"
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <Select
                  value={actionFilter}
                  onValueChange={(v) => {
                    setActionFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px] bg-black border-white/10 text-white text-sm">
                    <Activity size={14} className="mr-2 text-gray-500" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0F1C] border-white/10 text-white">
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((a) => (
                      <SelectItem key={a} value={a}>{formatActionName(a)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={entityFilter}
                  onValueChange={(v) => {
                    setEntityFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px] bg-black border-white/10 text-white text-sm">
                    <Box size={14} className="mr-2 text-gray-500" />
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0F1C] border-white/10 text-white">
                    <SelectItem value="all">All Entities</SelectItem>
                    {uniqueEntities.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-500" />
                <span className="text-sm text-gray-400">From</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-[140px] bg-black border-white/10 text-white text-sm h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">To</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-[140px] bg-black border-white/10 text-white text-sm h-9"
                />
              </div>
              {(actionFilter !== "all" || entityFilter !== "all" || dateFrom || dateTo || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setActionFilter("all");
                    setEntityFilter("all");
                    setDateFrom("");
                    setDateTo("");
                    setCurrentPage(1);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Clear all
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
                  <TableHead className="text-gray-400 font-medium">Date</TableHead>
                  <TableHead className="text-gray-400 font-medium">User</TableHead>
                  <TableHead className="text-gray-400 font-medium">Action</TableHead>
                  <TableHead className="text-gray-400 font-medium">Entity Type</TableHead>
                  <TableHead className="text-gray-400 font-medium">Entity ID</TableHead>
                  <TableHead className="text-gray-400 font-medium">Details</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <ClipboardList size={32} className="mx-auto mb-3 text-gray-600" />
                      <p>No audit logs found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((log) => (
                    <TableRow
                      key={log.id}
                      className="border-white/5 hover:bg-white/[0.02]"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-400">
                              {new Date(log.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-400 truncate">
                              {log.profiles?.full_name || log.user_id?.slice(0, 8) || "System"}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {log.profiles?.email || ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getActionColor(log.action)} font-medium capitalize whitespace-nowrap`}
                        >
                          {formatActionName(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Box size={14} className="text-gray-500 shrink-0" />
                          <span className="text-sm text-gray-400">{log.entity_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-400 font-mono">
                          {log.entity_id ? log.entity_id.slice(0, 12) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {log.details ? "View" : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          onClick={() => setDetailLog(log)}
                        >
                          <ArrowUpRight size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination with per-page selector */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Per page:</span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(v) => {
                      setItemsPerPage(Number(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-7 bg-black border-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F1C] border-white/10 text-white">
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0A0F1C] border border-white/10 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Audit Log Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white"
                  onClick={() => setDetailLog(null)}
                >
                  <FileText size={16} />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4F5BFF]/10 flex items-center justify-center">
                    <ClipboardList size={20} className="text-[#4F5BFF]" />
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`${getActionColor(detailLog.action)} font-medium capitalize`}
                    >
                      {formatActionName(detailLog.action)}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(detailLog.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem icon={User} label="User" value={detailLog.profiles?.full_name || detailLog.user_id || "System"} />
                  <InfoItem icon={User} label="Email" value={detailLog.profiles?.email || "—"} />
                  <InfoItem icon={Box} label="Entity Type" value={detailLog.entity_type} />
                  <InfoItem icon={ArrowUpRight} label="Entity ID" value={detailLog.entity_id || "—"} />
                </div>

                {detailLog.details && Object.keys(detailLog.details).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Details</p>
                    <div className="bg-black rounded-lg border border-white/5 p-3">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(detailLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={() => setDetailLog(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
