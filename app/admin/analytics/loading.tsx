import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-4 w-64 mt-2 bg-white/5" />
        </div>
        <Skeleton className="h-10 w-72 bg-white/5" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="bg-[#0A0F1C] border-white/5">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-4 mb-2 bg-white/5" />
              <Skeleton className="h-3 w-20 bg-white/5" />
              <Skeleton className="h-7 w-12 mt-2 bg-white/5" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-[#0A0F1C] border-white/5">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-40 mb-4 bg-white/5" />
              <div className="flex items-center justify-center h-64">
                <Loader2 size={28} className="text-[#C9A961] animate-spin" />
                <span className="ml-3 text-sm text-gray-400">Loading charts...</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
