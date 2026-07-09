import {
  Bot,
  CalendarDays,
  Clock,
  MessageCircle,
  MessagesSquare,
  Send,
  Sparkles,
  UserCheck,
} from "lucide-react";
import StatCard from "./StatCard";

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});
}

function Detail({ label, value, darkMode }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
        darkMode
          ? "border-[#202c33] bg-[#0f1a20]"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div
        className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
          darkMode ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </div>

      <div
        className={`mt-3 text-sm leading-6 ${
          darkMode ? "text-slate-100" : "text-slate-800"
        }`}
      >
        {value || "Not available"}
      </div>
    </div>
  );
}

export default function OverviewTab({ data, darkMode }) {
  const overview = data?.overview || {};
  const messages = data?.messages || {};
  const summary = data?.summary || {};

  const averageLength = Math.round(
    ((messages.averageIncomingLength || 0) +
      (messages.averageOutgoingLength || 0)) /
      2,
  );

  return (
    <div className="space-y-7">
      {/* Stats */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Messages"
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
          label="Average / Day"
          value={messages.averageMessagesPerDay || 0}
          icon={Clock}
          tone="amber"
          darkMode={darkMode}
        />

        <StatCard
          label="Avg Length"
          value={averageLength}
          hint="Characters"
          icon={UserCheck}
          tone="violet"
          darkMode={darkMode}
        />
      </div>

      {/* Conversation Overview */}

      <div
        className={`rounded-2xl border p-6 shadow-sm ${
          darkMode
            ? "border-[#202c33] bg-[#111b21]"
            : "border-slate-200 bg-white"
        }`}
      >
        {/* Header */}

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-3">
            <Bot
              size={20}
              className="text-emerald-500"
            />
          </div>

          <div>
            <h3
              className={`text-lg font-semibold ${
                darkMode
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              Overview
            </h3>

            <p
              className={`mt-1 text-sm ${
                darkMode
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              General information and AI insights
            </p>
          </div>
        </div>

        {/* Details */}

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Detail
            label="Conversation Age"
            value={`${overview.conversationDays || 0} days`}
            darkMode={darkMode}
          />

          <Detail
            label="First Message"
            value={formatDate(
              overview.firstMessage,
            )}
            darkMode={darkMode}
          />

          <Detail
            label="Last Message"
            value={formatDate(
              overview.lastMessage,
            )}
            darkMode={darkMode}
          />

          <Detail
            label="Relationship"
            value={overview.relationship}
            darkMode={darkMode}
          />

          <Detail
            label="Bot Enabled"
            value={
              overview.botEnabled
                ? "Enabled"
                : "Disabled"
            }
            darkMode={darkMode}
          />

          <Detail
            label="Summary Status"
            value={summary.status || "Empty"}
            darkMode={darkMode}
          />
        </div>

        {/* AI Profile */}

        <div className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles
              size={18}
              className="text-violet-500"
            />

            <h4
              className={`font-semibold ${
                darkMode
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              AI Profile
            </h4>
          </div>

          <Detail
            label="Profile"
            value={
              overview.aiProfile ||
              "No contact-specific AI profile has been configured."
            }
            darkMode={darkMode}
          />
        </div>

        {/* Summary */}

        <div className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays
              size={18}
              className="text-emerald-500"
            />

            <h4
              className={`font-semibold ${
                darkMode
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              AI Conversation Summary
            </h4>
          </div>

          <div
            className={`rounded-xl border p-5 leading-7 ${
              darkMode
                ? "border-[#202c33] bg-[#0f1a20] text-slate-300"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {summary.text ||
              "No conversation summary has been generated yet."}
          </div>
        </div>
      </div>
    </div>
  );
}