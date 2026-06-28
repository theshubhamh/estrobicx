"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Startup dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="bg-[#0A0F1C] border-red-500/30 p-8 max-w-md w-full text-center">
        <div className="p-3 rounded-full bg-red-500/10 w-fit mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-slate-400 mb-6">
          {error.message || "Failed to load startup dashboard data."}
        </p>
        <Button
          onClick={reset}
          className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </Card>
    </div>
  );
}
