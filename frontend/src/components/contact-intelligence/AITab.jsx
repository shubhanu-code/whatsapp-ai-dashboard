import { useState, useMemo } from "react";
import {
  Bot,
  BrainCircuit,
  Clock3,
  Cpu,
  Gauge,
  MessageSquareText,
  Sparkles,
  Zap,
} from "lucide-react";

import ChartCard, { BreakdownList } from "./ChartCard";
import StatCard from "./StatCard";
import TimeRangeSelector from "../common/TimeRangeSelector";
import { card, heading, muted } from "../../utils/ui";

export default function AITab({ data, darkMode }) {
  const [selectedPeriod, setSelectedPeriod] = useState("lifetime");

  // ── Data Resolution ────────────────────────────────────────────────────────
  
  const ai = data?.ai || {};
  const graphs = data?.graphs || {};

  // Safely memoize token and metric lookups relative to selected timeframe period
  const stats = useMemo(() => {
    return data?.tokens?.[selectedPeriod] || {};
  }, [data, selectedPeriod]);

  // Fallbacks that respect the scoped timeframe analytics window first
  const currentRequests = stats.replies ?? ai.overview?.totalRequests ?? 0;
  const currentLatency  = stats.averageLatencyMs ?? ai.overview?.averageLatencyMs ?? 0;
  const currentTokens   = stats.averageTokens ?? ai.overview?.averageTokens ?? 0;
  const modelsCount     = ai.overview?.modelsUsed ?? 0;

  // Defensive mutations to preserve array rendering pipelines safely
  const dailyTrendData = useMemo(() => {
    const trend = graphs.tokenDailyTrend;
    return Array.isArray(trend) ? [...trend].reverse() : [];
  }, [graphs.tokenDailyTrend]);

  const monthlyTrendData = useMemo(() => {
    const trend = graphs.tokenMonthlyTrend;
    return Array.isArray(trend) ? [...trend].reverse() : [];
  }, [graphs.tokenMonthlyTrend]);

  const providersData = ai.providers || graphs.providerUsage || [];
  const modelsData    = ai.models || graphs.modelUsage || [];

  return (
    <div className="space-y-7 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${heading(darkMode)}`}>
            AI Analytics
          </h2>
          <p className={`mt-2 text-sm ${muted(darkMode)}`}>
            Monitor AI usage, token consumption, model performance and provider activity.
          </p>
        </div>

        <TimeRangeSelector
          value={selectedPeriod}
          onChange={setSelectedPeriod}
          darkMode={darkMode}
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Requests"
          value={currentRequests}
          icon={Bot}
          darkMode={darkMode}
        />

        <StatCard
          label="Avg Latency"
          value={`${currentLatency} ms`}
          icon={Clock3}
          tone="amber"
          darkMode={darkMode}
        />

        <StatCard
          label="Avg Tokens"
          value={currentTokens}
          icon={Gauge}
          tone="blue"
          darkMode={darkMode}
        />

        <StatCard
          label="Prompt"
          value={stats.promptTokens || 0}
          icon={MessageSquareText}
          tone="cyan"
          darkMode={darkMode}
        />

        <StatCard
          label="Completion"
          value={stats.completionTokens || 0}
          icon={Zap}
          tone="violet"
          darkMode={darkMode}
        />

        <StatCard
          label="Models"
          value={modelsCount}
          icon={Cpu}
          tone="rose"
          darkMode={darkMode}
        />
      </div>

      {/* Charts Pipeline */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          icon={Sparkles}
          title="Daily Token Trend"
          description="Prompt versus completion token usage"
          data={dailyTrendData}
          type="line"
          xKey="period"
          yKey="totalTokens"
          darkMode={darkMode}
          bars={[
            { dataKey: "promptTokens", fill: "#3b82f6" },
            { dataKey: "completionTokens", fill: "#25D366" },
          ]}
        />

        <ChartCard
          icon={BrainCircuit}
          title="Monthly Token Trend"
          description="Overall token consumption over time"
          data={monthlyTrendData}
          type="bar"
          xKey="period"
          yKey="totalTokens"
          darkMode={darkMode}
        />
      </div>

      {/* Breakdown Lists */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        
        {/* Providers */}
        <div className={`rounded-2xl border p-6 shadow-sm ${card(darkMode)}`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/15 p-3">
              <Cpu size={20} className="text-cyan-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${heading(darkMode)}`}>
                Provider Usage
              </h3>
              <p className={`mt-1 text-sm ${muted(darkMode)}`}>
                Requests handled by each AI provider.
              </p>
            </div>
          </div>
          <div className="mt-7">
            <BreakdownList
              data={providersData}
              labelKey="provider"
              valueKey="requests"
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Models */}
        <div className={`rounded-2xl border p-6 shadow-sm ${card(darkMode)}`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-3">
              <Bot size={20} className="text-violet-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${heading(darkMode)}`}>
                Model Usage
              </h3>
              <p className={`mt-1 text-sm ${muted(darkMode)}`}>
                Distribution of requests across AI models.
              </p>
            </div>
          </div>
          <div className="mt-7">
            <BreakdownList
              data={modelsData}
              labelKey="model"
              valueKey="requests"
              darkMode={darkMode}
            />
          </div>
        </div>

      </div>
    </div>
  );
}