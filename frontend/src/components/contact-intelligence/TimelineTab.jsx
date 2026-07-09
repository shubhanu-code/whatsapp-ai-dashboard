import { CalendarClock, Clock3, Flag, MessagesSquare } from "lucide-react";

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

function TimelineItem({ icon: Icon, title, value, darkMode }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500">
          <Icon size={18} />
        </div>
        <div className={`mt-2 h-full w-px ${darkMode ? "bg-[#202c33]" : "bg-slate-200"}`} />
      </div>
      <div className="pb-6">
        <div className={`text-sm font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>
          {title}
        </div>
        <div className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function TimelineTab({ data, darkMode }) {
  const overview = data?.overview || {};
  const summary = data?.summary || {};

  return (
    <div
      className={`rounded-lg border p-5 ${
        darkMode
          ? "bg-[#111b21] border-[#202c33]"
          : "bg-white border-slate-200"
      }`}
    >
      <h3 className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>
        Conversation Timeline
      </h3>
      <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        A future-ready activity stream for this contact.
      </p>

      <div className="mt-6">
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
        />
      </div>
    </div>
  );
}
