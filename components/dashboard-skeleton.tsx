"use client";

function Bone({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

function ListRow({ rank }: { rank?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {rank && <Bone className="w-4 h-3" />}
      <Bone className="w-5 h-5 !rounded-full shrink-0" />
      <Bone className="h-3.5 flex-1 max-w-[100px]" />
      <Bone className="w-10 h-3.5 ml-auto" />
    </div>
  );
}

function BlindPicksSkeleton() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <Bone className="w-36 h-3.5" />
        <Bone className="w-12 h-2.5" />
      </div>
      <div className="mt-2 space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListRow key={i} rank />
        ))}
      </div>
    </div>
  );
}

function BanTargetsSkeleton() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <Bone className="w-28 h-3.5" />
        <div className="flex gap-2">
          <Bone className="w-6 h-2.5" />
          <Bone className="w-12 h-2.5" />
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5">
            <Bone className="w-4 h-3" />
            <Bone className="w-5 h-5 !rounded-full shrink-0" />
            <Bone className="h-3.5 flex-1 max-w-[100px]" />
            <div className="flex gap-1 ml-auto">
              <Bone className="w-10 h-3.5" />
              <Bone className="w-10 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GapsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-card-border">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <Bone className="w-40 h-3.5" />
          <Bone className="w-14 h-2.5" />
        </div>
        <div className="mt-2 divide-y divide-card-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <Bone className="w-5 h-5 !rounded-full shrink-0" />
              <Bone className="h-3.5 flex-1 max-w-[100px]" />
              <Bone className="w-4 h-4 !rounded-full shrink-0" />
              <Bone className="w-10 h-3.5" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <Bone className="w-28 h-3.5" />
        </div>
        <div className="mt-2 space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5">
              <Bone className="w-5 h-5 !rounded-full shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <Bone className="h-3.5 w-20" />
                <Bone className="h-2.5 w-28" />
              </div>
              <Bone className="w-7 h-7 !rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="bg-card border border-card-border rounded-lg overflow-hidden divide-y divide-card-border">
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-card-border">
        <BlindPicksSkeleton />
        <BanTargetsSkeleton />
      </div>
      <GapsSkeleton />
    </div>
  );
}
