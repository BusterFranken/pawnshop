import { Skeleton } from "@/components/ui/skeleton";

export default function AppraisalLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5rem)] p-4">
      <div className="flex-1 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-8 w-2/3" />
      </div>
      <div className="lg:w-80 xl:w-96">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
