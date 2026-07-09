import React, { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_AI_ANALYTICS = {
  overview: {
    totalRequests: 0,
    totalTokens: 0,
    averageTokens: 0,
    modelsUsed: 0,
  },
  tokenBreakdown: {
    promptTokens: 0,
    completionTokens: 0,
    promptPercent: 0,
    completionPercent: 0,
  },
  topContacts: [],
  modelUsage: [],
  performance: {},
  aiHealth: {
    status: "",
    efficiency: 0,
    activeModels: 0,
  },
};

// ── Reusable stat card ──────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className={`p-5 rounded-xl ${color}`}>
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// ── Reusable progress bar ───────────────────────────────────────────────────
function ProgressBar({ percent, color, darkMode }) {
  return (
    <div
      className={`h-3 rounded-full overflow-hidden ${
        darkMode ? "bg-slate-700" : "bg-slate-200"
      }`}
    >
      <div
        className={`h-full ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({ darkMode, className = "", children }) {
  return (
    <div
      className={`mt-6 rounded-xl p-5 ${
        darkMode ? "bg-[#202c33]" : "bg-white"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Analytics({ darkMode }) {
  const [analytics, setAnalytics] = useState({
    messagesSent: 0,
    messagesReceived: 0,
    totalContacts: 0,
    activeRules: 0,
  });
  const [topContacts, setTopContacts] = useState([]);
  const [breakdown, setBreakdown] = useState({ incoming: 0, outgoing: 0 });
  const [peakHours, setPeakHours] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [aiAnalytics, setAIAnalytics] = useState(DEFAULT_AI_ANALYTICS);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [
          res,
          contactsRes,
          peakRes,
          aiRes,
          dailyRes,
          breakdownRes,
        ] = await Promise.all([
          fetch(`${API_BASE}/analytics`),
          fetch(`${API_BASE}/analytics/top-contacts`),
          fetch(`${API_BASE}/analytics/peak-hours`),
          fetch(`${API_BASE}/analytics/ai`),
          fetch(`${API_BASE}/analytics/daily-activity`),
          fetch(`${API_BASE}/analytics/breakdown`),
        ]);

        const [
          data,
          contactsData,
          peakData,
          aiData,
          dailyData,
          breakdownData,
        ] = await Promise.all([
          res.json(),
          contactsRes.json(),
          peakRes.json(),
          aiRes.json(),
          dailyRes.json(),
          breakdownRes.json(),
        ]);

        setAnalytics(data);
        setTopContacts(contactsData);
        setPeakHours(peakData);
        setAIAnalytics(aiData);
        setDailyActivity([...dailyData].reverse());
        setBreakdown(breakdownData);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      }
    };

    loadAnalytics();
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const totalMessages = breakdown.incoming + breakdown.outgoing;
  const incomingPercent =
    totalMessages === 0 ? 0 : (breakdown.incoming / totalMessages) * 100;
  const outgoingPercent =
    totalMessages === 0 ? 0 : (breakdown.outgoing / totalMessages) * 100;

  const maxContactMessages = topContacts[0]?.totalMessages || 1;
  const maxAITokens = aiAnalytics.topContacts[0]?.totalTokens || 1;

  return (
    <div>
      {/* ── Page title ────────────────────────────────────────────────────── */}
      <h1
        className={`text-2xl font-bold mb-6 ${
          darkMode ? "text-white" : "text-slate-800"
        }`}
      >
        Analytics
      </h1>

      {/* ── Overview stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Messages Sent"
          value={analytics.messagesSent}
          color="bg-[#25D366]/10"
        />
        <StatCard
          label="Messages Received"
          value={analytics.messagesReceived}
          color="bg-blue-500/10"
        />
        <StatCard
          label="Contacts"
          value={analytics.totalContacts}
          color="bg-orange-500/10"
        />
        <StatCard
          label="Active Rules"
          value={analytics.activeRules}
          color="bg-purple-500/10"
        />
      </div>

      {/* ── Top Contacts ──────────────────────────────────────────────────── */}
      <Section darkMode={darkMode}>
        <h2 className="text-lg font-semibold mb-4">Top Contacts</h2>

        <div className="space-y-4">
          {topContacts.map((contact, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center font-bold">
                    {contact.contactName?.[0] ?? "?"}
                  </div>
                  <span>{contact.contactName}</span>
                </div>
                <span className="font-bold">{contact.totalMessages}</span>
              </div>

              <ProgressBar
                percent={(contact.totalMessages / maxContactMessages) * 100}
                color="bg-[#25D366]"
                darkMode={darkMode}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Message Breakdown ─────────────────────────────────────────────── */}
      <Section darkMode={darkMode}>
        <h2 className="text-lg font-semibold mb-4">Message Breakdown</h2>

        <div className="mb-2 flex justify-between">
          <span>Incoming</span>
          <span>{breakdown.incoming}</span>
        </div>
        <ProgressBar
          percent={incomingPercent}
          color="bg-blue-500"
          darkMode={darkMode}
        />

        <div className="mt-5 mb-2 flex justify-between">
          <span>Outgoing</span>
          <span>{breakdown.outgoing}</span>
        </div>
        <ProgressBar
          percent={outgoingPercent}
          color="bg-[#25D366]"
          darkMode={darkMode}
        />
      </Section>

      {/* ── Peak Hours chart ──────────────────────────────────────────────── */}
      <Section darkMode={darkMode}>
        <h2 className="text-lg font-semibold mb-4">Peak Hours</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={peakHours}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="hour"
              tickFormatter={(hour) => `${hour}:00`}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="total"
              fill="#25D366"
              radius={[10, 10, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Daily Activity chart ──────────────────────────────────────────── */}
      <Section darkMode={darkMode}>
        <h2 className="text-lg font-semibold mb-4">Daily Activity</h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={dailyActivity}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#25D366"
              strokeWidth={3}
              dot={{ r: 4, fill: "#25D366" }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      {/* ── AI Analytics panel ────────────────────────────────────────────── */}
      <div
        className={`mt-10 rounded-3xl border overflow-hidden ${
          darkMode
            ? "bg-[#111b21] border-[#202c33]"
            : "bg-white border-slate-200"
        }`}
      >
        {/* Header */}
        <div
          className={`px-8 py-6 border-b ${
            darkMode ? "border-[#202c33]" : "border-slate-200"
          }`}
        >
          <h2 className="text-2xl font-bold">AI Analytics</h2>
          <p className={`mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Monitor AI usage, token consumption, model usage and contact insights.
          </p>
        </div>

        <div className="p-8">
          {/* AI overview stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            <StatCard
              label="AI Requests"
              value={aiAnalytics.overview.totalRequests}
              color="bg-cyan-500/10"
            />
            <StatCard
              label="Total Tokens"
              value={aiAnalytics.overview.totalTokens}
              color="bg-green-500/10"
            />
            <StatCard
              label="Avg / Reply"
              value={aiAnalytics.overview.averageTokens}
              color="bg-orange-500/10"
            />
            <StatCard
              label="Models Used"
              value={aiAnalytics.overview.modelsUsed}
              color="bg-purple-500/10"
            />
          </div>

          {/* AI Health */}
          <div
            className={`mt-8 rounded-2xl border p-6 ${
              darkMode
                ? "bg-[#202c33] border-[#2a3942]"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold">AI Health</div>
                <div className={`mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  System operating normally.
                </div>
              </div>
              <div className="text-green-500 font-semibold">
                {aiAnalytics.aiHealth?.status || "Loading"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-6">
              <div>
                <div className="text-xs text-slate-500">Requests</div>
                <div className="text-xl font-semibold">
                  {aiAnalytics.overview.totalRequests}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Prompt Efficiency</div>
                <div className="text-xl font-semibold">
                  {aiAnalytics.aiHealth?.efficiency ?? 0}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Active Models</div>
                <div className="text-xl font-semibold">
                  {aiAnalytics.aiHealth?.activeModels ?? 0}
                </div>
              </div>
            </div>
          </div>

          <hr className={`my-8 ${darkMode ? "border-[#202c33]" : "border-slate-200"}`} />

          {/* Token Breakdown */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold">Token Breakdown</h3>
            <p className={`mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Distribution of prompt and completion tokens.
            </p>

            <div className="space-y-6 mt-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Prompt Tokens</span>
                  <span>{aiAnalytics.tokenBreakdown.promptPercent}%</span>
                </div>
                <ProgressBar
                  percent={aiAnalytics.tokenBreakdown.promptPercent}
                  color="bg-[#25D366]"
                  darkMode={darkMode}
                />
                <div className={`mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {(aiAnalytics.tokenBreakdown.promptTokens ?? 0).toLocaleString()} tokens
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span>Completion Tokens</span>
                  <span>{aiAnalytics.tokenBreakdown.completionPercent ?? 0}%</span>
                </div>
                <ProgressBar
                  percent={aiAnalytics.tokenBreakdown.completionPercent ?? 0}
                  color="bg-blue-500"
                  darkMode={darkMode}
                />
                <div className={`mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {(aiAnalytics.tokenBreakdown.completionTokens ?? 0).toLocaleString()} tokens
                </div>
              </div>
            </div>
          </div>

          {/* Top AI Contacts */}
          <div
            className={`mt-8 rounded-2xl p-6 ${
              darkMode ? "bg-[#202c33]" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold">Top AI Contacts</h3>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Contacts consuming the most AI resources
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {aiAnalytics.topContacts.map((contact) => (
                <div
                  key={contact.phoneNumber}
                  className={`rounded-xl border p-5 ${
                    darkMode
                      ? "border-[#2a3942] bg-[#111b21]"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  {/* Contact header */}
                  <div className="flex justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center">
                        <UserRound size={22} className="text-[#25D366]" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{contact.name}</div>
                        <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {contact.relationship}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-3xl font-bold ${
                          darkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {contact.totalTokens.toLocaleString()}
                      </div>
                      <div
                        className={`text-xs font-medium uppercase tracking-wider ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        Total Tokens
                      </div>
                    </div>
                  </div>

                  {/* Token usage bar */}
                  <div className="mt-6">
                    <ProgressBar
                      percent={(contact.totalTokens / maxAITokens) * 100}
                      color="bg-[#25D366]"
                      darkMode={darkMode}
                    />
                  </div>

                  {/* Contact stats */}
                  <div className="grid grid-cols-3 gap-8 mt-6">
                    <div>
                      <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Requests
                      </div>
                      <div className="font-semibold">{contact.requests}</div>
                    </div>
                    <div>
                      <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Avg Tokens
                      </div>
                      <div className="font-semibold">{contact.averageTokens}</div>
                    </div>
                    <div>
                      <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Prompt Tokens
                      </div>
                      <div className="font-semibold">
                        {contact.promptTokens.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
