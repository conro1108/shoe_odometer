import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ShoeDetailLoading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-32" />

      {/* Shoe header */}
      <div className="flex flex-col sm:flex-row gap-6">
        <Skeleton className="w-full sm:w-48 h-48 rounded-lg flex-shrink-0" />
        <div className="flex flex-col justify-between flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Separator />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 flex flex-col items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <Separator />

      {/* Walk history */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-36" />
        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-40 hidden sm:block" />
                <Skeleton className="h-8 w-20 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
