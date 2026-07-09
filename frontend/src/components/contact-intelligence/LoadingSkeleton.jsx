import { useMemo } from "react";

// ─── Child Components ─────────────────────────────────────────────────────────

function StatSkeleton({ blockClass, innerBoneClass, subBoneClass }) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm ${blockClass}`}>
      <div className={`h-3 w-20 rounded-full ${innerBoneClass}`} />
      <div className={`mt-5 h-8 w-24 rounded-lg ${innerBoneClass}`} />
      <div className={`mt-5 h-2 w-full rounded-full ${subBoneClass}`} />
    </div>
  );
}

function ChartSkeleton({ blockClass, innerBoneClass, subBoneClass, barHeights }) {
  return (
    <div className={`rounded-2xl p-6 shadow-sm ${blockClass}`}>
      <div className={`h-5 w-40 rounded ${innerBoneClass}`} />
      <div className={`mt-3 h-3 w-64 rounded ${subBoneClass}`} />

      <div className="mt-8 flex h-52 items-end justify-between gap-2">
        {barHeights.map((height, index) => (
          <div
            key={index}
            className={`flex-1 rounded-t ${innerBoneClass}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoadingSkeleton({ darkMode }) {
  const heights = useMemo(() => [35, 55, 70, 45, 80, 60, 50, 90, 65, 75, 40, 85], []);

  // Theme-aware design token overrides
  const blockClass = darkMode ? "bg-[#182229]" : "bg-slate-100";
  const innerBoneClass = darkMode ? "bg-white/[0.06]" : "bg-slate-200";
  const subBoneClass = darkMode ? "bg-white/[0.03]" : "bg-slate-200/60";

  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton
            key={index}
            blockClass={blockClass}
            innerBoneClass={innerBoneClass}
            subBoneClass={subBoneClass}
          />
        ))}
      </div>

      {/* Main Analytical Chart */}
      <ChartSkeleton
        blockClass={blockClass}
        innerBoneClass={innerBoneClass}
        subBoneClass={subBoneClass}
        barHeights={heights}
      />

      {/* Dual Distribution Layout Block */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton
          blockClass={blockClass}
          innerBoneClass={innerBoneClass}
          subBoneClass={subBoneClass}
          barHeights={heights}
        />
        <ChartSkeleton
          blockClass={blockClass}
          innerBoneClass={innerBoneClass}
          subBoneClass={subBoneClass}
          barHeights={heights}
        />
      </div>
    </div>
  );
}