export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  darkMode,
  tone = "emerald",
}) {
  const tones = {
    emerald: "text-emerald-600 bg-emerald-500/15",
    blue: "text-blue-600 bg-blue-500/15",
    amber: "text-amber-600 bg-amber-500/15",
    violet: "text-violet-600 bg-violet-500/15",
    rose: "text-rose-600 bg-rose-500/15",
    cyan: "text-cyan-600 bg-cyan-500/15",
  };

  return (
    <div
      className={`group cursor-default rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        darkMode
          ? "bg-[#111b21] border-[#202c33] hover:border-[#25D366]/40"
          : "bg-white border-slate-200 hover:border-[#25D366]/40"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col justify-between">
          <div
            className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {label}
          </div>

          <div
            className={`mt-3 text-3xl font-bold leading-none transition-all duration-300 ${
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
            className={`
              rounded-xl
              p-3
              transition-all
              duration-300
              group-hover:scale-110
              ${tones[tone] || tones.emerald}
            `}
          >
            <Icon size={20} strokeWidth={2.2} />
          </div>
        )}
      </div>

      {hint && (
        <div
          className={`
            mt-5
            pt-4
            border-t
            transition-colors
            ${
              darkMode
                ? "border-[#202c33] text-slate-400"
                : "border-slate-100 text-slate-500"
            }
          `}
        >
          <span className="text-xs font-medium tracking-wide">
            {hint}
          </span>
        </div>
      )}
    </div>
  );
}
