export default function LoadingSkeleton({ darkMode }) {
  const block = darkMode ? "bg-[#1d2a31]" : "bg-slate-200";
  const heights = [35, 55, 70, 45, 80, 60, 50, 90, 65, 75, 40, 85];

  function StatSkeleton() {
    return (
      <div
        className={`
          rounded-2xl
          p-5
          shadow-sm
          ${block}
        `}
      >
        <div className="h-3 w-20 rounded-full bg-white/10 dark:bg-white/10 bg-slate-300" />

        <div className="mt-5 h-8 w-24 rounded-lg bg-white/10 dark:bg-white/10 bg-slate-300" />

        <div className="mt-5 h-2 w-full rounded-full bg-white/5 dark:bg-white/5 bg-slate-300/70" />
      </div>
    );
  }

  function ChartSkeleton() {
    return (
      <div
        className={`
          rounded-2xl
          p-6
          shadow-sm
          ${block}
        `}
      >
        <div className="h-5 w-40 rounded bg-white/10 dark:bg-white/10 bg-slate-300" />
        <div className="mt-3 h-3 w-64 rounded bg-white/5 dark:bg-white/5 bg-slate-300/70" />

        <div className="mt-8 flex h-52 items-end justify-between gap-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="flex-1 rounded-t bg-white/10 dark:bg-white/10 bg-slate-300"
              style={{
                height: `${heights[index]}%`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>

      {/* Main Chart */}
      <ChartSkeleton />

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}