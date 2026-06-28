"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function InvestorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Investor dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <Card className="bg-[#0A0F1C] border-slate-800/60 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-6">
          {error.message || "Failed to load investor dashboard."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            className="border-slate-700 text-white hover:bg-white/5"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
          <Button
            className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
            onClick={reset}
          >
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
