"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin audit page error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track all platform actions and changes.
          </p>
        </div>
      </div>

      <Card className="bg-[#0A0F1C] border-white/5 card-glow">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-400 text-center max-w-md mb-6">
            {error.message || "Failed to load audit log data. Please try again."}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={reset}
              className="bg-[#C9A961] text-black hover:bg-[#C9A961]/90"
            >
              <RefreshCcw size={16} className="mr-2" />
              Try again
            </Button>
          </div>
          {error.digest && (
            <p className="text-xs text-gray-600 mt-4">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
