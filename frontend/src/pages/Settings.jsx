import { useState, useEffect } from "react";
import { API_BASE } from "../services/api";
import { Sparkles, Database, Layers3, Activity, Save, User } from "lucide-react";

// ── Reusable components ───────────────────────────────────────────────────────

function StatCard({ label, value, darkMode }) {
  return (
    <div
      className={`rounded-xl p-4 border transition-all ${
        darkMode ? "bg-[#202c33] border-[#2a3942]" : "bg-slate-50/50 border-slate-200"
      }`}
    >
      <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function inputClass(darkMode, extra = "") {
  return `w-full px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm transition-all border ${
    darkMode
      ? "bg-[#202c33] border-[#2a3942] text-white placeholder-slate-500"
      : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
  } ${extra}`;
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: "ai",     icon: Sparkles,  label: "AI Engine",   sub: "Context & Persona" },
  { id: "models", icon: Layers3,   label: "Providers",   sub: "Model Routing" },
  { id: "memory", icon: Database,  label: "Memory",      sub: "Message Storage" },
  { id: "tokens", icon: Activity,  label: "Analytics",   sub: "Token & Usage" },
];

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

export default function Settings({ darkMode, showToast }) {
  const [activeTab,   setActiveTab]   = useState("ai");
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [tokenStats,  setTokenStats]  = useState(DEFAULT_TOKEN_STATS);
  const [topContacts, setTopContacts] = useState([]);
  const [isSaving,    setIsSaving]    = useState(false);

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
    setIsSaving(true);
    try {
      await fetch(`${API_BASE}/settings`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(settings),
      });
      if (showToast) {
        showToast("Configuration settings saved successfully");
      } else {
        alert("Settings saved");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      if (showToast) showToast("Failed to save configuration settings", "error");
    } finally {
      setIsSaving(false);
    }
  }

  function update(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  // ── Layout Style Bindings ───────────────────────────────────────────────────

  const panelClass = `rounded-lg border shadow-sm p-6 space-y-6 ${
    darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/60"
  }`;

  return (
    <div className={`space-y-6 max-w-5xl animate-in fade-in duration-300 ${darkMode ? "text-white" : ""}`}>
      
      {/* Page Header */}
      <div>
        <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
          System Settings
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          Configure workspace model routing, background prompt contexts, and monitor API traffic analytics.
        </p>
      </div>

      {/* Tabs Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                active
                  ? "bg-[#008069] text-white border-[#008069] shadow-sm"
                  : darkMode
                  ? "bg-[#111b21] border-[#202c33] hover:border-[#008069]/40 text-white"
                  : "bg-white border-slate-200 hover:border-[#008069]/40 text-slate-700"
              }`}
            >
              <Icon size={18} className={active ? "text-white" : "text-[#008069]"} />
              <div className="mt-2.5">
                <div className="font-semibold text-sm leading-tight">{tab.label}</div>
                <div className={`text-xs mt-0.5 ${active ? "text-white/80" : "text-slate-400"}`}>
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Workspace Configuration Panel Layer */}
      <div className={panelClass}>
        
        {/* ── AI Tab View ────────────────────────────────────────────────── */}
        {activeTab === "ai" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-semibold">Global Prompt Architecture</h2>
              <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Define core behavioral identities, global fallback rules, and operational boundaries.
              </p>
            </div>

            <textarea
              rows={10}
              value={settings.ai_context}
              onChange={(e) => update("ai_context", e.target.value)}
              placeholder="System-wide behavior framing context..."
              className={`${inputClass(darkMode)} font-mono text-xs leading-relaxed p-4 resize-none`}
            />

            <Field label="Identity Style Ruleset">
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
          </div>
        )}

        {/* ── Models Tab View ────────────────────────────────────────────── */}
        {activeTab === "models" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-semibold">Routing Engine</h2>
              <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Select the underlying foundational LLM pipeline that powers unstructured context inference.
              </p>
            </div>

            <Field label="Active Model Vendor">
              <select
                value={settings.ai_model}
                onChange={(e) => update("ai_model", e.target.value)}
                className={inputClass(darkMode)}
              >
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout</option>
              </select>
            </Field>
          </div>
        )}

        {/* ── Memory Tab View ────────────────────────────────────────────── */}
        {activeTab === "memory" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-semibold">State Retention System</h2>
              <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Manage sliding short-term conversation thread window parameters.
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-emerald-500/10 cursor-pointer transition-all">
              <input
                type="checkbox"
                className="mt-1 accent-[#008069] h-4 w-4 rounded"
                checked={settings.memory_enabled === true || settings.memory_enabled === "true"}
                onChange={(e) => update("memory_enabled", e.target.checked)}
              />
              <div className="space-y-0.5">
                <span className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                  Persistent Memory Arrays
                </span>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Allow conversational processing chains to contextually inspect deep message backlogs.
                </p>
              </div>
            </label>

            <div className={`pt-2 ${!(settings.memory_enabled === true || settings.memory_enabled === "true") ? "opacity-35 pointer-events-none transition-all" : "transition-all"}`}>
              <Field label="Sliding History Threshold (Messages)">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.memory_limit}
                    onChange={(e) => update("memory_limit", Number(e.target.value))}
                    className={`${inputClass(darkMode)} w-28 text-center font-semibold`}
                  />
                  <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    historical units managed inside inference blocks
                  </span>
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* ── Analytics Tab View ──────────────────────────────────────────── */}
        {activeTab === "tokens" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-semibold">Execution Metrics</h2>
              <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Real-time visibility into overall inference token payload statistics.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Total Tokens"      value={tokenStats.totalTokens?.toLocaleString() ?? "0"}      darkMode={darkMode} />
              <StatCard label="Total Requests"    value={tokenStats.totalRequests ?? "0"}    darkMode={darkMode} />
              <StatCard label="Average / Payload" value={tokenStats.averageTokens ?? "0"}    darkMode={darkMode} />
              <StatCard label="Prompt Load"       value={tokenStats.promptTokens?.toLocaleString() ?? "0"}     darkMode={darkMode} />
              <StatCard label="Completion Output" value={tokenStats.completionTokens?.toLocaleString() ?? "0"} darkMode={darkMode} />
            </div>
          </div>
        )}

        {/* Control Commit Interceptor */}
        {activeTab !== "tokens" && (
          <div className="flex justify-end pt-4 border-t border-dashed ${darkMode ? 'border-[#2a3942]' : 'border-slate-100'}">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-[#008069] hover:bg-[#006e5a] active:scale-[0.98] disabled:opacity-50 transition-all text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm shadow-emerald-700/10"
            >
              <Save size={15} />
              {isSaving ? "Saving..." : "Save Config"}
            </button>
          </div>
        )}
      </div>

      {/* Top AI Contacts Analytics Block */}
      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-lg font-bold">Top Traffic Consumer Endpoints</h3>
          <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Monitoring specific linked contact addresses utilizing processing capacity allocations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topContacts.map((contact) => (
            <div
              key={contact.phoneNumber}
              className={`rounded-xl border p-4 flex justify-between items-center transition-all ${
                darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/60 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  darkMode ? "bg-[#202c33] text-emerald-400" : "bg-emerald-50 text-[#008069]"
                }`}>
                  <User size={16} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{contact.name}</div>
                  <div className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-indigo-600/80"}`}>
                    {contact.relationship || "Unknown Thread"}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-sm text-emerald-500">
                  {contact.totalTokens.toLocaleString()}
                </div>
                <div className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {contact.requests} hits
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}