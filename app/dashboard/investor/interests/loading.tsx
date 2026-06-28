import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function InterestsLoading() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 bg-[#0A0F1C]" />
          <Skeleton className="h-4 w-48 mt-2 bg-[#0A0F1C]" />
        </div>
      </div>

      <Card className="bg-[#0A0F1C] border-slate-800/60 p-4">
        <Skeleton className="h-10 w-full max-w-sm bg-black" />
      </Card>

      <Card className="bg-[#0A0F1C] border-slate-800/60 overflow-hidden">
        <div className="p-0">
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-slate-800/60">
            {Array.from({ length: 5 }).map((_, i) => (
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
                  <Skeleton className="h-8 w-24 bg-black" />
                  <Skeleton className="h-8 w-16 bg-black" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
