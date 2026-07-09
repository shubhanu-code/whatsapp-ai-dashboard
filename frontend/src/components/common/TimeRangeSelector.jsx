const PERIODS = [
  { label: "24H", value: "hour" },
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "Lifetime", value: "lifetime" },
];

export default function TimeRangeSelector({
  value,
  onChange,
  darkMode,
}) {
  return (
    <div
      className={`
        inline-flex
        items-center
        rounded-2xl
        p-1.5
        shadow-sm
        border
        transition-all
        duration-300
        ${
          darkMode
            ? "bg-[#111b21] border-[#202c33]"
            : "bg-white border-slate-200"
        }
      `}
    >
      {PERIODS.map((period) => {
        const active = value === period.value;

        return (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`
              relative
              rounded-xl
              px-4
              py-2.5
              text-sm
              font-medium
              transition-all
              duration-300
              whitespace-nowrap

              ${
                active
                  ? "bg-[#25D366] text-white shadow-md"
                  : darkMode
                  ? "text-slate-400 hover:bg-[#202c33] hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }
            `}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}