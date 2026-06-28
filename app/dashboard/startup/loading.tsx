import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <Skeleton className="h-4 w-48 bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-[#0A0F1C] border-slate-800/60 p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-slate-800" />
                <Skeleton className="h-6 w-20 bg-slate-800" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <Skeleton className="h-6 w-32 bg-slate-800 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg bg-black/40 border border-slate-800/40 space-y-2">
                  <Skeleton className="h-4 w-20 bg-slate-800" />
                  <Skeleton className="h-6 w-24 bg-slate-800" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <Skeleton className="h-6 w-48 bg-slate-800 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-slate-800/40">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40 bg-slate-800" />
                    <Skeleton className="h-3 w-24 bg-slate-800" />
                  </div>
                  <Skeleton className="h-6 w-20 bg-slate-800" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <Skeleton className="h-6 w-32 bg-slate-800 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-slate-800/40">
                  <Skeleton className="h-8 w-8 rounded-lg bg-slate-800 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full bg-slate-800" />
                    <Skeleton className="h-3 w-20 bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <Skeleton className="h-6 w-32 bg-slate-800 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-slate-800" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
