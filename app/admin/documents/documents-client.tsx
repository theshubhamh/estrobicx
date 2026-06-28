"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  File,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { updateDocumentStatus, getSignedUrl } from "@/app/actions";

interface Document {
  id: string;
  startup_id: string;
  doc_type: "pitch_deck" | "financial_statements" | "incorporation" | "kyc_document" | "other";
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  admin_notes: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
  startups: {
    id: string;
    company_name: string;
  } | null;
}

interface DocumentsClientProps {
  documents: Document[];
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "amber", icon: Clock },
  approved: { label: "Approved", color: "emerald", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "red", icon: XCircle },
  suspended: { label: "Suspended", color: "gray", icon: File },
} as const;

const STATUS_COLORS: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  pitch_deck: "Pitch Deck",
  financial_statements: "Financial Statements",
  incorporation: "Incorporation",
  kyc_document: "KYC Document",
  other: "Other",
};

const DOC_TYPE_ICONS: Record<string, typeof File> = {
  pitch_deck: FileText,
  financial_statements: FileText,
  incorporation: FileText,
  kyc_document: FileText,
  other: File,
};

const ITEMS_PER_PAGE = 10;

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocumentsClient({ documents }: DocumentsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [reviewDoc, setReviewDoc] = useState<Document | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !search ||
        doc.file_name.toLowerCase().includes(search.toLowerCase()) ||
        (doc.startups?.company_name && doc.startups.company_name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  async function handleView(doc: Document) {
    setViewDoc(doc);
    setViewLoading(true);
    setSignedUrl(null);
    const result = await getSignedUrl(doc.file_path);
    setViewLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else if (result.signedUrl) {
      setSignedUrl(result.signedUrl);
    }
  }

  function openReview(doc: Document, status: string) {
    setReviewDoc(doc);
    setReviewStatus(status);
    setReviewNotes(doc.admin_notes || "");
  }

  async function handleReviewSubmit() {
    if (!reviewDoc) return;
    setReviewLoading(true);
    const result = await updateDocumentStatus(reviewDoc.id, reviewStatus, reviewNotes.trim() || undefined);
    setReviewLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Document ${reviewStatus}`);
      setReviewDoc(null);
      setReviewNotes("");
      setReviewStatus("");
      router.refresh();
    }
  }

  function StatusBadge({ status }: { status: Document["status"] }) {
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
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <p className="text-gray-400 text-sm mt-1">
          Review and manage startup KYC documents.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["pending", "approved", "rejected", "suspended"] as const).map((s) => {
          const count = documents.filter((d) => d.status === s).length;
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
                placeholder="Search by company name or file name..."
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
                  <TableHead className="text-gray-400 font-medium">File Name</TableHead>
                  <TableHead className="text-gray-400 font-medium">Company</TableHead>
                  <TableHead className="text-gray-400 font-medium">Doc Type</TableHead>
                  <TableHead className="text-gray-400 font-medium">Status</TableHead>
                  <TableHead className="text-gray-400 font-medium">Uploaded</TableHead>
                  <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      <FileText size={32} className="mx-auto mb-3 text-gray-600" />
                      <p>No documents found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((doc) => {
                    const DocIcon = DOC_TYPE_ICONS[doc.doc_type] || File;
                    return (
                      <TableRow
                        key={doc.id}
                        className="border-white/5 hover:bg-white/[0.02]"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DocIcon size={14} className="text-gray-500" />
                            <div className="flex flex-col">
                              <span className="text-sm text-white">{doc.file_name}</span>
                              <span className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-gray-500" />
                            <span className="text-sm text-white">
                              {doc.startups?.company_name || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-[#4F5BFF]/10 text-[#4F5BFF] border-[#4F5BFF]/20 text-[10px]"
                          >
                            {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={doc.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-500" />
                            <span className="text-sm text-gray-400">
                              {formatDate(doc.uploaded_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                              onClick={() => handleView(doc)}
                            >
                              <Eye size={14} className="mr-1" />
                              View
                            </Button>
                            {doc.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                  onClick={() => openReview(doc, "approved")}
                                >
                                  <Check size={14} className="mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                  onClick={() => openReview(doc, "rejected")}
                                >
                                  <XCircle size={14} className="mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            Showing {paginated.length} of {filtered.length} documents
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

      {/* View Document Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText size={18} className="text-[#C9A961]" />
              {viewDoc?.file_name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {viewDoc?.startups?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {viewLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-[#C9A961] animate-spin" />
                <span className="ml-3 text-sm text-gray-400">Loading document...</span>
              </div>
            )}
            {!viewLoading && signedUrl && (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-black overflow-hidden">
                  {viewDoc?.mime_type?.startsWith("image/") ? (
                    <img
                      src={signedUrl}
                      alt={viewDoc.file_name}
                      className="w-full max-h-[500px] object-contain"
                    />
                  ) : viewDoc?.mime_type === "application/pdf" ? (
                    <iframe
                      src={signedUrl}
                      className="w-full h-[500px]"
                      title={viewDoc.file_name}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <File size={48} className="text-gray-600 mb-4" />
                      <p className="text-sm text-gray-400 mb-2">This file cannot be previewed</p>
                      <Button
                        variant="outline"
                        className="border-[#C9A961]/20 text-[#C9A961] hover:bg-[#C9A961]/10"
                        onClick={() => window.open(signedUrl, "_blank")}
                      >
                        <ExternalLink size={14} className="mr-2" />
                        Open in new tab
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{DOC_TYPE_LABELS[viewDoc?.doc_type || ""] || viewDoc?.doc_type}</span>
                    <span>{formatFileSize(viewDoc?.file_size || null)}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="border-[#C9A961]/20 text-[#C9A961] hover:bg-[#C9A961]/10"
                    onClick={() => window.open(signedUrl, "_blank")}
                  >
                    <ExternalLink size={14} className="mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewDoc(null)}
              className="border-white/10 text-gray-400 hover:bg-white/5"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Document Dialog */}
      <Dialog open={!!reviewDoc} onOpenChange={() => setReviewDoc(null)}>
        <DialogContent className="bg-[#0A0F1C] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {reviewStatus === "approved" ? "Approve Document" : "Reject Document"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {reviewDoc?.file_name} — {reviewDoc?.startups?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                Admin Notes
              </label>
              <Textarea
                placeholder="Optional notes about your decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="bg-black border-white/10 text-white placeholder:text-gray-600 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDoc(null)}
              className="border-white/10 text-gray-400 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={reviewLoading}
              className={
                reviewStatus === "approved"
                  ? "bg-emerald-500 text-white hover:bg-emerald-500/90"
                  : "bg-red-500 text-white hover:bg-red-500/90"
              }
            >
              {reviewLoading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : reviewStatus === "approved" ? (
                <Check size={16} className="mr-2" />
              ) : (
                <XCircle size={16} className="mr-2" />
              )}
              {reviewStatus === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
