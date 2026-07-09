import { useMemo } from "react";
import {
  Bot,
  Hand,
  MessageCircle,
  MessagesSquare,
  Send,
  ShieldCheck,
  BarChart3,
  Activity,
} from "lucide-react";

import ChartCard, { BreakdownList } from "./ChartCard";
import StatCard from "./StatCard";
import { card, heading, muted } from "../../utils/ui";

export default function MessagesTab({ data, darkMode }) {
  const messages = data?.messages || {};
  const graphs = data?.graphs || {};

  // Prevent expensive array re-allocation and re-sorting loops on every render pass
  const dailyTrend = useMemo(() => {
    const rawTrend = graphs.dailyTrend || [];
    return typeof rawTrend.toReversed === "function" 
      ? rawTrend.toReversed() 
      : [...rawTrend].reverse();
  }, [graphs.dailyTrend]);

  // Unified design token evaluations
  const headingStyles = heading(darkMode);
  const mutedStyles = muted(darkMode);

  return (
    <div className="space-y-7">
      {/* Header Info Block */}
      <div>
        <h2 className={`text-2xl font-bold tracking-tight ${headingStyles}`}>
          Messages
        </h2>
        <p className={`mt-2 text-sm ${mutedStyles}`}>
          Analyze incoming, outgoing and automated message activity.
        </p>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total"
          value={messages.total || 0}
          icon={MessagesSquare}
          darkMode={darkMode}
        />
        <StatCard
          label="Incoming"
          value={messages.incoming || 0}
          icon={MessageCircle}
          tone="blue"
          darkMode={darkMode}
        />
        <StatCard
          label="Outgoing"
          value={messages.outgoing || 0}
          icon={Send}
          tone="cyan"
          darkMode={darkMode}
        />
        <StatCard
          label="Manual"
          value={messages.manualReplies || 0}
          icon={Hand}
          tone="amber"
          darkMode={darkMode}
        />
        <StatCard
          label="Rules"
          value={messages.ruleReplies || 0}
          icon={ShieldCheck}
          tone="violet"
          darkMode={darkMode}
        />
        <StatCard
          label="AI"
          value={messages.aiReplies || 0}
          icon={Bot}
          tone="rose"
          darkMode={darkMode}
        />
      </div>

      {/* Analytical Visualizations Group */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        
        {/* Reply Breakdown Matrix */}
        <div className={`rounded-2xl border p-6 shadow-sm transition-colors ${card(darkMode)}`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-3">
              <BarChart3 size={20} className="text-violet-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${headingStyles}`}>
                Reply Breakdown
              </h3>
              <p className={`mt-1 text-sm ${mutedStyles}`}>
                Distribution of manual, rule-based and AI replies.
              </p>
            </div>
          </div>

          <div className="mt-7">
            <BreakdownList
              data={graphs.replyBreakdown || []}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Daily Longitudinal Activity Chart */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-3">
              <Activity size={20} className="text-emerald-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${headingStyles}`}>
                Daily Activity
              </h3>
              <p className={`mt-1 text-sm ${mutedStyles}`}>
                Incoming versus outgoing conversations over time.
              </p>
            </div>
          </div>

          <ChartCard
            title=""
            description=""
            data={dailyTrend}
            type="line"
            xKey="day"
            darkMode={darkMode}
            bars={[
              {
                dataKey: "incoming",
                fill: "#3b82f6",
              },
              {
                dataKey: "outgoing",
                fill: "#25D366",
              },
            ]}
          />
        </div>

      </div>
    </div>
  );
}