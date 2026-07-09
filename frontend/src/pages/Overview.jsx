import { Bot, Users, SquareCode, CheckCircle2 } from "lucide-react";
import { API_BASE } from "../services/api";

// ── Reusable components ───────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, darkMode }) {
  return (
    <div
      className={`p-5 rounded-xl border flex items-center justify-between ${
        darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-[#f8f9fa] border-slate-200/40"
      }`}
    >
      <div className="space-y-1">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-800"}`}>
          {value}
        </p>
      </div>

      <div
        className={`p-3 rounded-xl border ${
          darkMode
            ? "bg-[#202c33] border-[#2a3942] text-emerald-400"
            : "bg-white border-slate-100 text-emerald-600"
        }`}
      >
        <Icon size={22} />
      </div>
    </div>
  );
}

function Card({ darkMode, className = "", children }) {
  return (
    <div
      className={`rounded-2xl border shadow-sm p-6 ${
        darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/50"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function CardTitle({ darkMode, children }) {
  return (
    <h3
      className={`text-[15px] font-bold tracking-tight mb-5 ${
        darkMode ? "text-white" : "text-slate-800"
      }`}
    >
      {children}
    </h3>
  );
}

// ── Quick-start steps ─────────────────────────────────────────────────────────

const GUIDE_STEPS = [
  <>Add contacts and enable the bot for approved contacts in the <b className="text-emerald-600">Contacts</b> tab.</>,
  <>Create keyword-based automations in <b className="text-emerald-600">Auto-Reply Rules</b> for instant responses.</>,
  <>Choose between <b className="text-emerald-600">Rules Mode</b>, <b className="text-emerald-600">AI Mode</b>, or <b className="text-emerald-600">Smart Mode</b> to control how the bot responds.</>,
  <>Smart Mode automatically uses Groq AI whenever no matching rule is found.</>,
  <>Monitor activity and test conversations directly from the dashboard before going live.</>,
];

// ── Main component ────────────────────────────────────────────────────────────

export default function Overview({ rules, contacts, stats, replyMode, setReplyMode, darkMode }) {

  async function handleReplyModeChange(e) {
    const mode = e.target.value;
    setReplyMode(mode);
    try {
      await fetch(`${API_BASE}/settings`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ replyMode: mode }),
      });
    } catch (err) {
      console.error("Failed to save reply mode:", err);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">

      {/* Page title */}
      <h1 className={`text-3xl font-bold mb-8 ${darkMode ? "text-white" : "text-slate-800"}`}>
        Dashboard Overview
      </h1>

      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-600 to-[#075e54] text-white p-7 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-xl">
          <h3 className="font-bold text-2xl tracking-wide">WhatsApp AI Dashboard</h3>
          <p className="text-white/80 text-sm mt-1.5 font-medium">
            AI-Powered WhatsApp Automation Platform
          </p>
          <div className="mt-6 text-xs text-white/60 font-medium tracking-wide">
            Developed by Shubhanu Chatterjee
          </div>
        </div>

        {/* Decorative background icon */}
        <div className="absolute right-6 bottom-0 top-0 flex items-center justify-center opacity-10 pointer-events-none">
          <Bot size={180} strokeWidth={1} />
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Active Rules"
          value={rules.filter((r) => r.isActive).length}
          icon={SquareCode}
          darkMode={darkMode}
        />
        <StatCard
          label="Saved Contacts"
          value={contacts.length}
          icon={Users}
          darkMode={darkMode}
        />
        <StatCard
          label="Bot Replies Sent"
          value={stats.messagesSent}
          icon={Bot}
          darkMode={darkMode}
        />
      </div>

      {/* ── AI Configuration ─────────────────────────────────────────────────── */}
      <Card darkMode={darkMode}>
        <CardTitle darkMode={darkMode}>AI Configuration</CardTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                darkMode ? "text-slate-300" : "text-slate-500"
              }`}
            >
              Reply Mode
            </label>

            <select
              value={replyMode}
              onChange={handleReplyModeChange}
              className={`w-full px-4 py-3 rounded-xl border font-medium ${
                darkMode
                  ? "bg-[#202c33] border-[#2a3942] text-white"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <option value="rules">Rules Only</option>
              <option value="ai">AI Only</option>
              <option value="smart">Smart Mode</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Quick Start Guide ────────────────────────────────────────────────── */}
      <Card darkMode={darkMode} className="space-y-4">
        <CardTitle darkMode={darkMode}>Quick Start Guide</CardTitle>

        <ul
          className={`space-y-3.5 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}
        >
          {GUIDE_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 leading-relaxed">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={17} />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </Card>

    </div>
  );
}
