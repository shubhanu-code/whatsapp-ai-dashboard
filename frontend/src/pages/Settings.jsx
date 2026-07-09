import { useState, useEffect } from "react";
import { API_BASE } from "../services/api";
import { Sparkles, Database, Layers3, Activity } from "lucide-react";

// ── Reusable components ───────────────────────────────────────────────────────

function StatCard({ label, value, darkMode }) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        darkMode
          ? "bg-[#202c33] border-[#2a3942]"
          : "bg-white border-slate-200"
      }`}
    >
      <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </div>
      <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mt-6">
      <h3 className="font-medium mb-3">{label}</h3>
      {children}
    </div>
  );
}

function inputClass(darkMode) {
  return `w-full rounded-xl p-3 border ${
    darkMode
      ? "bg-[#202c33] border-[#2a3942] text-white placeholder:text-slate-500"
      : "bg-white border-slate-300"
  }`;
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: "ai",     icon: Sparkles,  label: "AI",     sub: "Context & Personality" },
  { id: "tokens", icon: Activity,  label: "Tokens", sub: "AI Usage" },
  { id: "memory", icon: Database,  label: "Memory", sub: "Conversation Storage" },
  { id: "models", icon: Layers3,   label: "Models", sub: "AI Providers" },
];

// ── Default state ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  ai_context:     "",
  ai_personality: "friendly",
  memory_enabled: true,
  memory_limit:   10,
  ai_model:       "llama-3.1-8b-instant",
};

const DEFAULT_TOKEN_STATS = {
  totalTokens:      0,
  totalRequests:    0,
  averageTokens:    0,
  promptTokens:     0,
  completionTokens: 0,
};

// ── Main component ────────────────────────────────────────────────────────────

export default function Settings({ darkMode }) {
  const [activeTab,   setActiveTab]   = useState("ai");
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [tokenStats,  setTokenStats]  = useState(DEFAULT_TOKEN_STATS);
  const [topContacts, setTopContacts] = useState([]);

  useEffect(() => {
    loadSettings();
    loadTokenStats();
    loadTopContacts();
  }, []);

  // ── Data fetchers ───────────────────────────────────────────────────────────

  async function loadSettings() {
    try {
      const res  = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }

  async function loadTokenStats() {
    try {
      const res  = await fetch(`${API_BASE}/analytics/tokens`);
      const data = await res.json();
      setTokenStats(data);
    } catch (err) {
      console.error("Failed to load token stats:", err);
    }
  }

  async function loadTopContacts() {
    try {
      const res  = await fetch(`${API_BASE}/analytics/top-contacts`);
      const data = await res.json();
      setTopContacts(data);
    } catch (err) {
      console.error("Failed to load top contacts:", err);
    }
  }

  async function saveSettings() {
    try {
      await fetch(`${API_BASE}/settings`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(settings),
      });
      alert("Settings saved");
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings");
    }
  }

  // ── Setting updater helper ──────────────────────────────────────────────────

  function update(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  // ── Card / panel wrapper ────────────────────────────────────────────────────

  const panelClass = `rounded-2xl p-6 shadow ${
    darkMode ? "bg-[#111b21] border border-[#202c33]" : "bg-white"
  }`;

  // ── Tab button ──────────────────────────────────────────────────────────────

  function TabButton({ tab }) {
    const Icon    = tab.icon;
    const active  = activeTab === tab.id;
    return (
      <button
        onClick={() => setActiveTab(tab.id)}
        className={`p-4 rounded-2xl border transition-all text-left ${
          active
            ? "bg-[#008069] text-white border-[#008069]"
            : darkMode
            ? "bg-[#202c33] border-[#2a3942] hover:border-[#008069] text-white"
            : "bg-white border-slate-200 hover:border-[#008069]"
        }`}
      >
        <Icon size={20} />
        <div className="mt-2">
          <div className="font-medium">{tab.label}</div>
          <div className="text-xs opacity-70">{tab.sub}</div>
        </div>
      </button>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-6 ${darkMode ? "text-white" : ""}`}>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className={`mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Configure AI behavior, memory and model selection.
        </p>
      </div>

      {/* Tab panel */}
      <div className={panelClass}>

        {/* Tab buttons */}
        <div className="grid md:grid-cols-4 gap-3 mb-6">
          {TABS.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>

        {/* ── AI tab ─────────────────────────────────────────────────────── */}
        {activeTab === "ai" && (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">AI Context</h2>
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Define the assistant's personality and behavior.
              </p>
            </div>

            <textarea
              rows={8}
              value={settings.ai_context}
              onChange={(e) => update("ai_context", e.target.value)}
              placeholder="Global AI Context"
              className={inputClass(darkMode)}
            />

            <Field label="AI Personality">
              <select
                value={settings.ai_personality}
                onChange={(e) => update("ai_personality", e.target.value)}
                className={inputClass(darkMode)}
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="humorous">Humorous</option>
              </select>
            </Field>
          </>
        )}

        {/* ── Models tab ─────────────────────────────────────────────────── */}
        {activeTab === "models" && (
          <>
            <h2 className="font-semibold mb-2">AI Model</h2>
            <p className={`text-sm mb-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Current Model: {settings.ai_model}
            </p>
            <select
              value={settings.ai_model}
              onChange={(e) => update("ai_model", e.target.value)}
              className={inputClass(darkMode)}
            >
              <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
              <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout</option>
            </select>
          </>
        )}

        {/* ── Tokens tab ─────────────────────────────────────────────────── */}
        {activeTab === "tokens" && (
          <div>
            <h2 className="font-semibold mb-4">Token Usage</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <StatCard label="Total Tokens"      value={tokenStats.totalTokens?.toLocaleString()}      darkMode={darkMode} />
              <StatCard label="Total Requests"    value={tokenStats.totalRequests}                       darkMode={darkMode} />
              <StatCard label="Prompt Tokens"     value={tokenStats.promptTokens?.toLocaleString()}     darkMode={darkMode} />
              <StatCard label="Completion Tokens" value={tokenStats.completionTokens?.toLocaleString()} darkMode={darkMode} />
              <StatCard label="Average / Request" value={tokenStats.averageTokens}                      darkMode={darkMode} />
            </div>
          </div>
        )}

      </div>

      {/* ── Memory tab (outside the tab panel — its own card) ────────────── */}
      {activeTab === "memory" && (
        <div className={panelClass}>
          <h2 className="font-semibold mb-4">Memory Settings</h2>

          <label className="flex gap-3 items-center cursor-pointer">
            <input
              type="checkbox"
              checked={
                settings.memory_enabled === true ||
                settings.memory_enabled === "true"
              }
              onChange={(e) => update("memory_enabled", e.target.checked)}
            />
            Enable Memory
          </label>

          <Field label="Memory Limit (messages)">
            <input
              type="number"
              value={settings.memory_limit}
              onChange={(e) => update("memory_limit", e.target.value)}
              className={inputClass(darkMode)}
            />
          </Field>
        </div>
      )}

      {/* Save button — hidden on the read-only Tokens tab */}
      {activeTab !== "tokens" && (
        <button
          onClick={saveSettings}
          className="bg-[#008069] hover:bg-[#006e5a] active:scale-[0.98] transition-all text-white px-6 py-3 rounded-xl font-medium shadow-sm"
        >
          Save Settings
        </button>
      )}

      {/* Top AI Contacts */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Top AI Contacts</h3>

        <div className="space-y-3">
          {topContacts.map((contact) => (
            <div
              key={contact.phoneNumber}
              className={`rounded-xl border p-4 flex justify-between items-center ${
                darkMode
                  ? "bg-[#202c33] border-[#2a3942]"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <div className="font-semibold">{contact.name}</div>
                <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {contact.relationship}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold">
                  {contact.totalTokens.toLocaleString()}
                </div>
                <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {contact.requests} requests
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
