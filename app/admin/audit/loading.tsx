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
        <Skeleton className="h-10 w-32 bg-white/5" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-[#0A0F1C] border-white/5">
            <CardContent className="p-4">
              <Skeleton className="h-3 w-16 bg-white/5" />
              <Skeleton className="h-8 w-12 mt-2 bg-white/5" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter skeleton */}
      <Card className="bg-[#0A0F1C] border-white/5">
        <CardContent className="p-4">
          <Skeleton className="h-10 w-full bg-white/5 mb-3" />
          <Skeleton className="h-9 w-64 bg-white/5" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card className="bg-[#0A0F1C] border-white/5 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-[#C9A961] animate-spin" />
            <span className="ml-3 text-sm text-gray-400">Loading audit logs...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
