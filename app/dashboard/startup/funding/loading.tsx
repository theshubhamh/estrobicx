import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <Skeleton className="h-4 w-64 bg-slate-800" />
        </div>
        <Skeleton className="h-10 w-32 bg-slate-800" />
      </div>

      <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
        <Skeleton className="h-6 w-40 bg-slate-800 mb-4" />
        <div className="flex items-center gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-10 w-24 bg-slate-800" />
              <Skeleton className="h-4 w-4 bg-slate-800" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
        <Skeleton className="h-6 w-48 bg-slate-800 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-black/40 border border-slate-800/40">
              <Skeleton className="h-8 w-8 bg-slate-800" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 bg-slate-800" />
                <Skeleton className="h-3 w-20 bg-slate-800" />
              </div>
              <Skeleton className="h-6 w-20 bg-slate-800" />
              <Skeleton className="h-8 w-8 bg-slate-800" />
              <Skeleton className="h-8 w-8 bg-slate-800" />
              <Skeleton className="h-8 w-8 bg-slate-800" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
