import { useMemo } from "react";
import ChartCard, { HeatmapCard } from "./ChartCard";
import { heading, muted } from "../../utils/ui";
import {
  Activity,
  Clock3,
  CalendarDays,
  Flame,
  BarChart3,
  TrendingUp
} from "lucide-react";

export default function AnalyticsTab({ data, darkMode }) {
  const graphs = data?.graphs || {};

  // ── Safely Memoize & Reverse Array Mutations ──────────────────────────────
  const dailyData = useMemo(() => {
    return Array.isArray(graphs.dailyTrend) ? [...graphs.dailyTrend].reverse() : [];
  }, [graphs.dailyTrend]);

  const weeklyData = useMemo(() => {
    return Array.isArray(graphs.weeklyTrend) ? [...graphs.weeklyTrend].reverse() : [];
  }, [graphs.weeklyTrend]);

  const monthlyData = useMemo(() => {
    return Array.isArray(graphs.monthlyTrend) ? [...graphs.monthlyTrend].reverse() : [];
  }, [graphs.monthlyTrend]);

  const yearlyData = useMemo(() => {
    return Array.isArray(graphs.yearlyTrend) ? [...graphs.yearlyTrend].reverse() : [];
  }, [graphs.yearlyTrend]);

  const hourlyData = graphs.hourlyTrend || [];
  const weekdayData = graphs.weekdayDistribution || [];
  const heatmapData = graphs.heatmap || [];

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold ${heading(darkMode)}`}>
          Analytics
        </h2>
        <p className={`mt-2 text-sm ${muted(darkMode)}`}>
          Explore conversation activity across different time periods and identify
          communication patterns.
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          icon={Clock3}
          title="Hourly Activity"
          description="Message volume by hour"
          data={hourlyData}
          type="bar"
          xKey="hour"
          darkMode={darkMode}
        />

        <ChartCard
          icon={Activity}
          title="Daily Activity"
          description="Incoming versus outgoing messages"
          data={dailyData}
          type="line"
          xKey="day"
          darkMode={darkMode}
        />

        <ChartCard
          icon={CalendarDays}
          title="Weekly Activity"
          description="Conversation volume by week"
          data={weeklyData}
          type="line"
          xKey="week"
          darkMode={darkMode}
        />

        <ChartCard
          icon={TrendingUp}
          title="Monthly Activity"
          description="Message trends across months"
          data={monthlyData}
          type="bar"
          xKey="month"
          darkMode={darkMode}
        />

        <ChartCard
          icon={BarChart3}
          title="Yearly Growth"
          description="Long-term conversation activity"
          data={yearlyData}
          type="bar"
          xKey="year"
          darkMode={darkMode}
        />

        <ChartCard
          icon={Activity}
          title="Weekday Distribution"
          description="Activity by day of the week"
          data={weekdayData}
          type="bar"
          xKey="weekday"
          darkMode={darkMode}
        />

        {/* Dedicated Heatmap Rendering Layout */}
        <div className="xl:col-span-2 mt-2">
          <HeatmapCard
            icon={Flame}
            title="Activity Heatmap"
            description="Density of messages sent by day and hour combined"
            data={heatmapData}
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
}