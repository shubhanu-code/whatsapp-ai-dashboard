import React from "react";
import { CalendarClock, Clock3, Flag, MessagesSquare } from "lucide-react";

// ─── Pure Utility Handlers ───────────────────────────────────────────────────

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

// ─── Shared Primitive Subcomponents ──────────────────────────────────────────

function TimelineItem({ icon: Icon, title, value, darkMode, isLast = false }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <Icon size={16} />
        </div>
        {!isLast && (
          <div className={`my-1 w-px grow ${darkMode ? "bg-[#202c33]" : "bg-slate-200"}`} />
        )}
      </div>
      <div className="pb-7">
        <div className={`text-sm font-semibold tracking-wide ${darkMode ? "text-white" : "text-slate-800"}`}>
          {title}
        </div>
        <div className={`mt-1.5 text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Main Tab Component ───────────────────────────────────────────────────────

export default function TimelineTab({ data, darkMode }) {
  const overview = data?.overview || {};
  const summary = data?.summary || {};

  return (
    <div
      className={`rounded-xl border p-6 transition-colors ${
        darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200"
      }`}
    >
      <h3 className={`text-base font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>
        Conversation Timeline
      </h3>
      <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        A future-ready activity stream for this contact.
      </p>

      <div className="mt-7 flex flex-col">
        <TimelineItem
          icon={Flag}
          title="First Interaction"
          value={formatDate(summary.firstMessage || overview.firstMessage)}
          darkMode={darkMode}
        />
        <TimelineItem
          icon={Clock3}
          title="Latest Interaction"
          value={formatDate(summary.lastMessage || overview.lastMessage)}
          darkMode={darkMode}
        />
        <TimelineItem
          icon={CalendarClock}
          title="Conversation Duration"
          value={`${overview.conversationDays || 0} days`}
          darkMode={darkMode}
        />
        <TimelineItem
          icon={MessagesSquare}
          title="Conversation Summary"
          value={summary.text || "No generated summary yet."}
          darkMode={darkMode}
          isLast
        />
      </div>
    </div>
  );
}