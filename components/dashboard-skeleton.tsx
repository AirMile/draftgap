"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* EnemySearch skeleton */}
      <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
        <div className="w-full h-11 rounded-lg bg-card-border/30" />
      </div>

      {/* QuickPick skeleton - not shown without enemy selected */}

      <hr className="border-card-border max-w-xs mx-auto" />

      {/* PoolInput compact skeleton */}
      <div className="bg-card border border-card-border rounded-xl p-4 space-y-2">
        <div className="w-full h-11 rounded-lg bg-card-border/30" />
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-lg bg-card-border/30" />
          <div className="h-8 w-20 rounded-lg bg-card-border/30" />
          <div className="h-8 w-28 rounded-lg bg-card-border/30" />
        </div>
      </div>

      {/* BlindPickBan skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-card-border/40" />
          <div className="space-y-1.5">
            <div className="w-16 h-3 rounded bg-card-border/30" />
            <div className="w-24 h-4 rounded bg-card-border/40" />
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-card-border/40" />
          <div className="space-y-1.5">
            <div className="w-16 h-3 rounded bg-card-border/30" />
            <div className="w-24 h-4 rounded bg-card-border/40" />
          </div>
        </div>
      </div>

      {/* GapAnalysis skeleton */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Worst matchups */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="w-28 h-4 rounded bg-card-border/30 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-card-border/40" />
                  <div className="w-20 h-3.5 rounded bg-card-border/30" />
                  <div className="w-12 h-3.5 rounded bg-card-border/30 ml-auto" />
                </div>
              ))}
            </div>
          </div>
          {/* Suggestions */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="w-24 h-4 rounded bg-card-border/30 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-card-border/40" />
                  <div className="w-24 h-3.5 rounded bg-card-border/30" />
                  <div className="w-16 h-6 rounded bg-card-border/30 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
