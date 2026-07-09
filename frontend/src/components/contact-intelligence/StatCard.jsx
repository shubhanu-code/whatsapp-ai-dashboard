import React from "react";

// Move mappings outside component to prevent reference generation on every render pass
const TONE_CLASSES = {
  emerald: { icon: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/15" },
  blue:    { icon: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-500/15" },
  amber:   { icon: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/15" },
  violet:  { icon: "text-violet-600 dark:text-violet-400",   bg: "bg-violet-500/15" },
  rose:    { icon: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-500/15" },
  cyan:    { icon: "text-cyan-600 dark:text-cyan-400",       bg: "bg-cyan-500/15" },
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  darkMode,
  tone = "emerald",
}) {
  const currentTone = TONE_CLASSES[tone] || TONE_CLASSES.emerald;

  return (
    <div
      className={`group cursor-default rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        darkMode
          ? "bg-[#111b21] border-[#202c33] hover:border-[#25D366]/40"
          : "bg-white border-slate-200 hover:border-[#25D366]/40"
      }`}
    >
      {/* Ensure parent container hides or wraps overflow cleanly */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        
        {/* Added min-w-0 so text block container can contract in tight grids */}
        <div className="flex flex-col justify-between min-w-0">
          <div
            className={`text-[11px] font-semibold uppercase tracking-[0.18em] truncate ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {label}
          </div>

          <div
            className={`mt-3 text-3xl font-bold leading-none transition-all duration-300 truncate ${
              darkMode
                ? "text-white group-hover:text-[#25D366]"
                : "text-slate-900 group-hover:text-[#008069]"
            }`}
          >
            {value ?? 0}
          </div>
        </div>

        {Icon && (
          <div
            className={`rounded-xl p-3 transition-all duration-300 group-hover:scale-110 shrink-0 ${currentTone.bg} ${currentTone.icon}`}
          >
            <Icon size={20} strokeWidth={2.2} />
          </div>
        )}
      </div>

      {/* Hint tracking section remains untouched */}
      {hint && (
        <div
          className={`mt-5 pt-4 border-t transition-colors ${
            darkMode ? "border-[#202c33] text-slate-400" : "border-slate-100 text-slate-500"
          }`}
        >
          <span className="text-xs font-medium tracking-wide block truncate">
            {hint}
          </span>
        </div>
      )}
    </div>
  );
}