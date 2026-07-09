import React from "react";
import { Bot, Users, SquareCode, CheckCircle2 } from "lucide-react";
import { API_BASE } from "../services/api";

// ── Shared Primitive Subcomponents ──────────────────────────────────────────

function StatCard({ label, value, icon: Icon, darkMode }) {
  return (
    <div
      className={`p-5 rounded-xl border flex items-center justify-between transition-all duration-300 ${
        darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-[#f8f9fa] border-slate-200/40"
      }`}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider truncate">
          {label}
        </p>
        <p className={`text-3xl font-extrabold truncate ${darkMode ? "text-white" : "text-slate-800"}`}>
          {value ?? 0}
        </p>
      </div>

      <div
        className={`p-3 rounded-xl border shrink-0 transition-colors ${
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
      className={`rounded-2xl border shadow-sm p-6 transition-colors ${
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

// ── Pure Static Layout Config Assets ─────────────────────────────────────────

const GUIDE_STEPS = [
  "Add contacts and enable the bot for approved contacts in the Contacts tab.",
  "Create keyword-based automations in Auto-Reply Rules for instant responses.",
  "Choose between Rules Mode, AI Mode, or Smart Mode to control how the bot responds.",
  "Smart Mode automatically uses Groq AI whenever no matching rule is found.",
  "Monitor activity and test conversations directly from the dashboard before going live.",
];

// ── Main Page View Component ──────────────────────────────────────────────────

export default function Overview({ 
  rules = [], 
  contacts = [], 
  stats = {}, 
  replyMode, 
  setReplyMode, 
  darkMode 
}) {

  async function handleReplyModeChange(e) {
    const mode = e.target.value;
    setReplyMode(mode);
    try {
      await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyMode: mode }),
      });
    } catch (err) {
      console.error("Failed to save reply mode:", err);
    }
  }

  const activeRulesCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Page Title */}
      <h1 className={`text-3xl font-bold mb-8 transition-colors ${darkMode ? "text-white" : "text-slate-800"}`}>
        Dashboard Overview
      </h1>

      {/* Hero Banner Banner Section */}
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

        {/* Decorative Background Vector Element */}
        <div className="absolute right-6 bottom-0 top-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
          <Bot size={180} strokeWidth={1} />
        </div>
      </div>

      {/* Stat Metric Grid Layout Array */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          label="Active Rules"
          value={activeRulesCount}
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
          value={stats?.messagesSent}
          icon={Bot}
          darkMode={darkMode}
        />
      </div>

      {/* Intelligent Operations Framework Dashboard Setup Panel */}
      <Card darkMode={darkMode}>
        <CardTitle darkMode={darkMode}>AI Configuration</CardTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Reply Mode
            </label>

            <select
              value={replyMode}
              onChange={handleReplyModeChange}
              className={`w-full px-4 py-3 rounded-xl border font-medium outline-none transition-colors cursor-pointer ${
                darkMode
                  ? "bg-[#202c33] border-[#2a3942] text-white focus:border-emerald-500/50"
                  : "bg-slate-50 border-slate-200 text-slate-700 focus:border-emerald-500/50"
              }`}
            >
              <option value="rules" className={darkMode ? "bg-[#111b21]" : "bg-white"}>Rules Only</option>
              <option value="ai" className={darkMode ? "bg-[#111b21]" : "bg-white"}>AI Only</option>
              <option value="smart" className={darkMode ? "bg-[#111b21]" : "bg-white"}>Smart Mode</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Operational Walkthrough Guide */}
      <Card darkMode={darkMode}>
        <CardTitle darkMode={darkMode}>Quick Start Guide</CardTitle>

        <ul className={`space-y-4 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
          {GUIDE_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 leading-relaxed">
              <CheckCircle2 className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" size={17} />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </Card>

    </div>
  );
}