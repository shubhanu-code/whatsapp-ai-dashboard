import { useState } from "react";
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

function tokens(data, period = "lifetime") {
  return data?.tokens?.[period] || {};
}

export default function AITab({ data, darkMode }) {
  const ai = data?.ai || {};
  const graphs = data?.graphs || {};

  const [selectedPeriod, setSelectedPeriod] =
    useState("lifetime");

  const stats = tokens(data, selectedPeriod);
  const overview = ai.overview || {};

  return (
    <div className="space-y-7">

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

      {/* Stats */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">

        <StatCard
          label="Requests"
          value={overview.totalRequests || stats.replies || 0}
          icon={Bot}
          darkMode={darkMode}
        />

        <StatCard
          label="Avg Latency"
          value={`${overview.averageLatencyMs || stats.averageLatencyMs || 0} ms`}
          icon={Clock3}
          tone="amber"
          darkMode={darkMode}
        />

        <StatCard
          label="Avg Tokens"
          value={overview.averageTokens || stats.averageTokens || 0}
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
          value={overview.modelsUsed || 0}
          icon={Cpu}
          tone="rose"
          darkMode={darkMode}
        />

      </div>

      {/* Token Charts */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        <ChartCard
          icon={Sparkles}
          title="Daily Token Trend"
          description="Prompt versus completion token usage"
          data={[...(graphs.tokenDailyTrend || [])].reverse()}
          type="line"
          xKey="period"
          yKey="totalTokens"
          darkMode={darkMode}
          bars={[
            {
              dataKey: "promptTokens",
              fill: "#3b82f6",
            },
            {
              dataKey: "completionTokens",
              fill: "#25D366",
            },
          ]}
        />

        <ChartCard
          icon={BrainCircuit}
          title="Monthly Token Trend"
          description="Overall token consumption over time"
          data={[...(graphs.tokenMonthlyTrend || [])].reverse()}
          type="bar"
          xKey="period"
          yKey="totalTokens"
          darkMode={darkMode}
        />

      </div>

      {/* Usage */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        <div
          className={`rounded-2xl border p-6 shadow-sm ${card(darkMode)}`}
        >
          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-cyan-500/15 p-3">
              <Cpu
                size={20}
                className="text-cyan-500"
              />
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
              data={ai.providers || graphs.providerUsage || []}
              labelKey="provider"
              valueKey="requests"
              darkMode={darkMode}
            />
          </div>

        </div>

        <div
          className={`rounded-2xl border p-6 shadow-sm ${card(darkMode)}`}
        >
          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-violet-500/15 p-3">
              <Bot
                size={20}
                className="text-violet-500"
              />
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
              data={ai.models || graphs.modelUsage || []}
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