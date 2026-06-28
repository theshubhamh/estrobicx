import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-64 bg-slate-800" />
      </div>

      <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
        <Skeleton className="h-6 w-40 bg-slate-800 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-[#0A0F1C] border-slate-800/60 p-6">
        <Skeleton className="h-6 w-32 bg-slate-800 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Skeleton className="h-10 w-32 bg-slate-800" />
      </div>
    </div>
  );
}
