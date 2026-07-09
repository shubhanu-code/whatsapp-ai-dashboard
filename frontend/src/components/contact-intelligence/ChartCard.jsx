import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

const CHART_HEIGHT = 260;
const COLORS = ["#25D366", "#3b82f6", "#a855f7", "#f59e0b", "#06b6d4", "#f43f5e"];

function EmptyState({ darkMode }) {
  return (
    <div
      className={`h-[260px] flex flex-col items-center justify-center rounded-2xl border border-dashed transition-all ${
        darkMode
          ? "border-[#2a3942] bg-[#0f1a20]"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div
        className={`rounded-2xl p-4 ${
          darkMode ? "bg-[#202c33]" : "bg-white"
        }`}
      >
        <BarChart3 size={34} className="text-[#25D366]" />
      </div>

      <h4
        className={`mt-5 text-lg font-semibold ${
          darkMode ? "text-white" : "text-slate-900"
        }`}
      >
        No analytics available
      </h4>

      <p
        className={`mt-2 max-w-xs text-center text-sm ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        This chart will automatically populate once enough activity has been recorded.
      </p>
    </div>
  );
}

function ChartTooltip({ darkMode }) {
  return (
    <Tooltip
      cursor={{
        stroke: "#25D366",
        strokeOpacity: 0.2,
        strokeWidth: 2,
      }}
      contentStyle={{
        borderRadius: 14,
        border: darkMode ? "1px solid #2a3942" : "1px solid #e5e7eb",
        background: darkMode ? "#111b21" : "#ffffff",
        color: darkMode ? "#ffffff" : "#111827",
        boxShadow: "0 12px 32px rgba(0,0,0,.12)",
        padding: "12px 14px",
      }}
      labelStyle={{
        fontWeight: 600,
        marginBottom: 8,
      }}
      itemStyle={{
        fontSize: 13,
      }}
    />
  );
}

export default function ChartCard({
  icon: Icon,
  title,
  description,
  data = [],
  type = "line",
  xKey,
  yKey = "total",
  bars,
  darkMode,
}) {
  const hasData = Array.isArray(data) && data.length > 0;
  const chartBars = bars || [{ dataKey: yKey, fill: COLORS[0] }];

  return (
    <div
      className={`group rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        darkMode
          ? "bg-[#111b21] border-[#202c33] hover:border-[#25D366]/40"
          : "bg-white border-slate-200 hover:border-[#25D366]/40"
      }`}
    >
      <div className="mb-6 flex items-start gap-4">
        {Icon && (
          <div className={`rounded-xl p-3 ${darkMode ? "bg-[#202c33]" : "bg-slate-100"}`}>
            <Icon size={20} className="text-[#25D366]" />
          </div>
        )}

        <div className="flex-1">
          {title && (
            <h3 className={`text-lg font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
              {title}
            </h3>
          )}
          {description && (
            <p className={`mt-1.5 text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {description}
            </p>
          )}
        </div>
      </div>
      
      {!hasData ? (
        <EmptyState darkMode={darkMode} />
      ) : (
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            {type === "bar" ? (
              <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" opacity={0.12} />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 12, fill: darkMode ? "#94a3b8" : "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: darkMode ? "#94a3b8" : "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip darkMode={darkMode} />
                {chartBars.map((bar, index) => (
                  <Bar
                    animationDuration={900}
                    animationEasing="ease"
                    key={bar.dataKey}
                    dataKey={bar.dataKey}
                    fill={bar.fill || COLORS[index % COLORS.length]}
                    radius={[6, 6, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" opacity={0.12} />
                <XAxis
                  dataKey={xKey}
                  tick={{ fontSize: 12, fill: darkMode ? "#94a3b8" : "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: darkMode ? "#94a3b8" : "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip darkMode={darkMode} />
                {chartBars.map((line, index) => (
                  <Line
                    key={line.dataKey}
                    type="monotone"
                    dataKey={line.dataKey}
                    stroke={line.fill || COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    animationDuration={900}
                    animationEasing="ease"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 3, stroke: "#fff" }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function BreakdownList({ data = [], labelKey = "name", valueKey = "value", darkMode }) {
  if (!data.length) {
    return <EmptyState darkMode={darkMode} />;
  }

  const max = Math.max(...data.map((row) => Number(row[valueKey] || 0)), 1);

  return (
    <div className="space-y-5">
      {data.map((row, index) => {
        const value = Number(row[valueKey] || 0);

        return (
          <div key={`${row[labelKey] || "item"}-${index}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className={`font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                {row[labelKey] || "Unknown"}
              </span>
              <span className={`text-sm font-semibold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                {value}
              </span>
            </div>
            <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? "bg-[#202c33]" : "bg-slate-100"}`}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(value / max) * 100}%`,
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HeatmapCard({ icon: Icon, title, description, data = [], darkMode }) {
  const hasData = Array.isArray(data) && data.length > 0;
  const max = hasData ? Math.max(...data.map((row) => Number(row.total || 0)), 1) : 1;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      className={`group rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        darkMode
          ? "bg-[#111b21] border-[#202c33] hover:border-[#25D366]/40"
          : "bg-white border-slate-200 hover:border-[#25D366]/40"
      }`}
    >
      <div className="mb-6 flex items-start gap-4">
        {Icon && (
          <div className={`rounded-xl p-3 ${darkMode ? "bg-[#202c33]" : "bg-slate-100"}`}>
            <Icon size={20} className="text-[#25D366]" />
          </div>
        )}

        <div className="flex-1">
          {title && (
            <h3 className={`text-lg font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
              {title}
            </h3>
          )}
          {description && (
            <p className={`mt-1.5 text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {description}
            </p>
          )}
        </div>
      </div>

      {!hasData ? (
        <EmptyState darkMode={darkMode} />
      ) : (
        <div className="mt-2 overflow-x-auto pb-2 scrollbar-thin">
          <div className="min-w-[560px] grid grid-cols-1 gap-2">
            {weekdays.map((day, dayIndex) => (
              <div key={day} className="grid grid-cols-[45px_1fr] items-center gap-2">
                <span className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {day}
                </span>
                <div
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
                >
                  {Array.from({ length: 24 }, (_, hour) => {
                    const row = data.find(
                      (item) => 
                        (Number(item.weekday) === dayIndex || item.day === day) && 
                        Number(item.hour) === hour
                    );
                    const intensity = Number(row?.total || 0) / max;

                    return (
                      <div
                        key={hour}
                        title={`${day} ${hour}:00 - Vol: ${row?.total || 0}`}
                        className="h-4 rounded-[3px] bg-emerald-500 transition-all duration-300 hover:scale-115 hover:z-10 cursor-pointer"
                        style={{ 
                          opacity: row?.total ? 0.12 + intensity * 0.88 : 0.06 
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}