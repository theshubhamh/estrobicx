"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { uploadDocument } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileUp,
  Shield,
} from "lucide-react";

interface KYCClientProps {
  startup: any;
  documents: any[];
  profile: any;
}

const docTypes = [
  { value: "pitch_deck", label: "Pitch Deck" },
  { value: "financial_statements", label: "Financial Statements" },
  { value: "incorporation", label: "Incorporation Documents" },
  { value: "kyc_document", label: "KYC Document" },
  { value: "other", label: "Other" },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  rejected: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  under_review: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: AlertCircle },
};

export default function KYCClient({ startup, documents: initialDocs, profile }: KYCClientProps) {
  const [documents, setDocuments] = useState(initialDocs);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  async function handleUpload() {
    if (!file || !docType || !startup?.id) {
      toast.error("Please select a file and document type");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);
      formData.append("startupId", startup.id);

      const result = await uploadDocument(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Document uploaded successfully");
        setFile(null);
        setDocType("");
        // Refresh document list
        const { data: newDocs } = await supabase
          .from("startup_documents")
          .select("*")
          .eq("startup_id", startup.id)
          .order("uploaded_at", { ascending: false });
        if (newDocs) setDocuments(newDocs);
      }
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(docId: string, filePath: string) {
    setDeletingId(docId);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("startup-documents")
        .remove([filePath]);

      if (storageError) {
        toast.error("Failed to delete file from storage");
        return;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("startup_documents")
        .delete()
        .eq("id", docId);

      if (dbError) {
        toast.error("Failed to delete document record");
        return;
      }

      toast.success("Document deleted");
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(docId: string, fileName: string) {
    try {
      const { data: signedUrl } = await supabase.storage
        .from("startup-documents")
        .createSignedUrl(`${startup.id}/${docId}/${fileName}`, 60);

      if (signedUrl) {
        window.open(signedUrl.signedUrl, "_blank");
      } else {
        toast.error("Failed to generate download link");
      }
    } catch (err: any) {
      toast.error(err?.message || "Download failed");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents & KYC</h1>
        <p className="text-slate-400 mt-1">
          Upload and manage your startup documents
        </p>
      </div>

      {/* Upload Section */}
      <Card className="bg-[#0A0F1C] border-slate-800/60 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9A961]/5 via-transparent to-[#4F5BFF]/5 opacity-50" />
        <div className="relative z-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#C9A961]" />
            Upload Document
          </h2>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragging
                ? "border-[#C9A961] bg-[#C9A961]/5"
                : "border-slate-700/50 bg-black/30 hover:border-slate-600/50"
            }`}
          >
            <FileUp className="h-10 w-10 text-[#C9A961] mx-auto mb-3" />
            <p className="text-white font-medium">
              {file ? file.name : "Drag and drop a file here, or click to browse"}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              PDF, DOC, DOCX, XLS, XLSX, PNG, JPG up to 20MB
            </p>
            <Input
              type="file"
              className="hidden"
              id="file-upload"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                className="mt-4 border-slate-700/50 text-slate-300 hover:text-white hover:border-[#C9A961]/50 hover:bg-[#C9A961]/5"
                asChild
              >
                <span>Select File</span>
              </Button>
            </label>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-64">
              <label className="text-sm text-slate-400 mb-1.5 block">Document Type</label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="bg-black/40 border-slate-800/60 text-white focus:ring-[#C9A961]/20">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1C] border-slate-800/60">
                  {docTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-white hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10"
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || !docType || isUploading}
              className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90 w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Documents List */}
      <Card className="bg-[#0A0F1C] border-slate-800/60 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4F5BFF]/5 via-transparent to-[#C9A961]/5 opacity-50" />
        <div className="relative z-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#C9A961]" />
            Uploaded Documents
          </h2>

          {documents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <p>No documents uploaded yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Upload your pitch deck, financials, and KYC documents above
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800/60 hover:bg-transparent">
                    <TableHead className="text-slate-400">File Name</TableHead>
                    <TableHead className="text-slate-400">Type</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Uploaded</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const status = doc.status || "pending";
                    const config = statusConfig[status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow
                        key={doc.id}
                        className="border-slate-800/60 hover:bg-white/5"
                      >
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#4F5BFF]" />
                            {doc.file_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {docTypes.find((t) => t.value === doc.doc_type)?.label || doc.doc_type}
                        </TableCell>
                        <TableCell>
                          <Badge className={`border ${config.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {doc.uploaded_at
                            ? new Date(doc.uploaded_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-[#4F5BFF] hover:bg-[#4F5BFF]/10"
                              onClick={() => handleDownload(doc.id, doc.file_name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDelete(doc.id, doc.file_path)}
                              disabled={deletingId === doc.id}
                            >
                              {deletingId === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
