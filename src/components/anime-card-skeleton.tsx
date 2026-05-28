import { Skeleton } from "@/components/ui/skeleton";

export function AnimeCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full rounded-xl" />
      <div className="mt-2 space-y-1.5 px-1">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}

export function AnimeCardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}
