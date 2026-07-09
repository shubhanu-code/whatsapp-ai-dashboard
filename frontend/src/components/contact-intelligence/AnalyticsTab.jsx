import ChartCard, { HeatmapCard } from "./ChartCard";
import { heading, muted } from "../../utils/ui";
import {
    Activity,
    Clock3,
    CalendarDays,
    Flame
} from "lucide-react";

export default function AnalyticsTab({ data, darkMode }) {
  const graphs = data?.graphs || {};

  return (
    <div className="space-y-7">
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

      {/* Charts */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          icon={Clock3}
          title="Hourly Activity"
          description="Message volume by hour"
          data={graphs.hourlyTrend || []}
          type="bar"
          xKey="hour"
          darkMode={darkMode}
        />

        <ChartCard
          icon={Activity}
          title="Daily Activity"
          description="Incoming versus outgoing messages"
          data={[...(graphs.dailyTrend || [])].reverse()}
          type="line"
          xKey="day"
          darkMode={darkMode}
        />

        <ChartCard
          icon={CalendarDays}
          title="Weekly Activity"
          description="Conversation volume by week"
          data={[...(graphs.weeklyTrend || [])].reverse()}
          type="line"
          xKey="week"
          darkMode={darkMode}
        />

        <ChartCard
          title="Monthly Activity"
          description="Message trends across months"
          data={[...(graphs.monthlyTrend || [])].reverse()}
          type="bar"
          xKey="month"
          darkMode={darkMode}
        />

        <ChartCard
          title="Yearly Growth"
          description="Long-term conversation activity"
          data={[...(graphs.yearlyTrend || [])].reverse()}
          type="bar"
          xKey="year"
          darkMode={darkMode}
        />

        <ChartCard
          title="Weekday Distribution"
          description="Activity by day of the week"
          data={graphs.weekdayDistribution || []}
          type="bar"
          xKey="weekday"
          darkMode={darkMode}
        />

        <div className="xl:col-span-2 mt-2">
          <ChartCard
            icon={Flame}
            title="Activity Heatmap"
            data={graphs.heatmap || []}
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
}