import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DealsLoading() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 bg-[#0A0F1C]" />
          <Skeleton className="h-4 w-48 mt-2 bg-[#0A0F1C]" />
        </div>
      </div>

      <Card className="bg-[#0A0F1C] border-slate-800/60 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1 bg-black" />
          <Skeleton className="h-10 w-[140px] bg-black" />
          <Skeleton className="h-10 w-[140px] bg-black" />
        </div>
      </Card>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="bg-[#0A0F1C] border-slate-800/60 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 bg-black" />
                <Skeleton className="h-4 w-32 bg-black" />
              </div>
              <Skeleton className="h-8 w-24 bg-black" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
