import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AdminInterestsLoading() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 bg-[#0A0F1C]" />
          <Skeleton className="h-4 w-48 mt-2 bg-[#0A0F1C]" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="bg-[#0A0F1C] border-slate-800/60 p-4">
            <Skeleton className="h-4 w-24 bg-black" />
            <Skeleton className="h-8 w-16 mt-1 bg-black" />
          </Card>
        ))}
      </div>

      <Card className="bg-[#0A0F1C] border-slate-800/60 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 bg-black" />
          <Skeleton className="h-10 w-[140px] bg-black" />
        </div>
      </Card>

      <Card className="bg-[#0A0F1C] border-slate-800/60 overflow-hidden">
        <div className="p-0">
          <div className="grid grid-cols-7 gap-4 p-4 border-b border-slate-800/60">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20 bg-black" />
            ))}
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 bg-black" />
                  <Skeleton className="h-3 w-32 bg-black" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-16 bg-black" />
                  <Skeleton className="h-8 w-16 bg-black" />
                  <Skeleton className="h-8 w-24 bg-black" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
