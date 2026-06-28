"use client";

import { useState } from "react";
import { toast } from "sonner";
import { respondToClarification } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HelpCircle,
  MessageCircle,
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ClarificationsClientProps {
  startup: any;
  clarifications: any[];
  profile: any;
}

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  responded: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
};

export default function ClarificationsClient({
  startup,
  clarifications: initialClarifications,
  profile,
}: ClarificationsClientProps) {
  const [clarifications, setClarifications] = useState(initialClarifications);
  const [selectedClarification, setSelectedClarification] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const supabase = createClient();

  async function handleRespond() {
    if (!selectedClarification?.id || !responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await respondToClarification(
        selectedClarification.id,
        responseText.trim(),
      );
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Response submitted successfully");
        setIsDialogOpen(false);
        setResponseText("");
        setSelectedClarification(null);
        // Refresh
        const { data: newClarifications } = await (supabase
          .from("clarification_requests") as any)
          .select("*")
          .eq("startup_id", startup?.id)
          .order("created_at", { ascending: false });
        if (newClarifications) setClarifications(newClarifications);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openRespondDialog(clarification: any) {
    setSelectedClarification(clarification);
    setResponseText(clarification.response || "");
    setIsDialogOpen(true);
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clarifications</h1>
        <p className="text-slate-400 mt-1">
          Respond to questions from Estrobic Capital
        </p>
      </div>

      <Card className="bg-[#0A0F1C] border-slate-800/60 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9A961]/5 via-transparent to-[#4F5BFF]/5 opacity-50" />
        <div className="relative z-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#C9A961]" />
            Clarification Requests
          </h2>

          {clarifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 text-slate-600" />
              <p>No clarifications requested</p>
              <p className="text-sm text-slate-500 mt-1">
                Clarification requests will appear here when the team needs more information
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clarifications.map((cl) => {
                const status = cl.status || "pending";
                const config = statusConfig[status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const isExpanded = expandedId === cl.id;

                return (
                  <div
                    key={cl.id}
                    className="border border-slate-800/60 rounded-lg overflow-hidden hover:border-slate-700/50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer bg-black/20"
                      onClick={() => toggleExpand(cl.id)}
                    >
                      <div className="p-2 rounded-lg bg-[#4F5BFF]/10">
                        <HelpCircle className="h-4 w-4 text-[#4F5BFF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {cl.question}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {cl.created_at
                            ? new Date(cl.created_at).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                      <Badge className={`border shrink-0 ${config.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status}
                      </Badge>
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800/60 bg-black/40">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-1">
                              Question
                            </h4>
                            <p className="text-white text-sm">{cl.question}</p>
                          </div>

                          {cl.response && (
                            <div>
                              <h4 className="text-sm font-medium text-slate-400 mb-1">
                                Your Response
                              </h4>
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-sm text-emerald-100">{cl.response}</p>
                                {cl.responded_at && (
                                  <p className="text-xs text-emerald-400/70 mt-2">
                                    Responded on {new Date(cl.responded_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {status === "pending" && (
                            <Button
                              onClick={() => openRespondDialog(cl)}
                              className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Respond
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Respond Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0A0F1C] border-slate-800/60 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Respond to Clarification</DialogTitle>
            <DialogDescription className="text-slate-400">
              Provide your response to the team&apos;s question
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-black/40 border border-slate-800/40">
              <p className="text-sm text-slate-400 mb-1">Question</p>
              <p className="text-white text-sm">{selectedClarification?.question}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Your Response</label>
              <Textarea
                placeholder="Type your response here..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={5}
                className="bg-black/40 border-slate-800/60 text-white placeholder:text-slate-600 focus:border-[#C9A961]/50 focus:ring-[#C9A961]/20 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDialogOpen(false);
                setResponseText("");
                setSelectedClarification(null);
              }}
              className="text-slate-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={isSubmitting || !responseText.trim()}
              className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Response
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
