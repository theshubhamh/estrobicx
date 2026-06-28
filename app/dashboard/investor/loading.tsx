import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function InvestorLoading() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 bg-[#0A0F1C]" />
          <Skeleton className="h-4 w-48 mt-2 bg-[#0A0F1C]" />
        </div>
        <Skeleton className="h-8 w-24 bg-[#0A0F1C]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-[#0A0F1C] border-slate-800/60 p-5">
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-4 w-24 bg-black" />
                <Skeleton className="h-6 w-32 mt-1 bg-black" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg bg-black" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <Skeleton className="h-6 w-32 mb-4 bg-black" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg bg-black/40 border border-slate-800/40">
                  <Skeleton className="h-4 w-20 bg-[#0A0F1C]" />
                  <Skeleton className="h-6 w-24 mt-2 bg-[#0A0F1C]" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <Skeleton className="h-6 w-48 mb-4 bg-black" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-black" />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <Skeleton className="h-6 w-32 mb-4 bg-black" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full bg-black" />
              ))}
            </div>
          </Card>

          <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
            <Skeleton className="h-6 w-24 mb-4 bg-black" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-black" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
