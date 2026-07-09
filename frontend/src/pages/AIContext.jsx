import { useEffect, useState } from "react";
import { Save, Brain, MessageSquare } from "lucide-react";
import { API_BASE } from "../services/api";

// ── Reusable helper for styling inputs consistently ──────────────────────────
function inputClass(darkMode, extra = "") {
  return `w-full px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm transition-all border ${
    darkMode
      ? "bg-[#202c33] border-[#2a3942] text-white placeholder-slate-500"
      : "bg-slate-50/50 border-slate-200 text-slate-800 placeholder-slate-400"
  } ${extra}`;
}

export default function AIContext({ darkMode, showToast }) {
  const [context, setContext] = useState("");
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memoryLimit, setMemoryLimit] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  // ── Fetch Initial Settings ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then((r) => r.json())
      .then((data) => {
        setContext(data.ai_context || "");
        setMemoryEnabled(data.memory_enabled === "true" || data.memory_enabled === true);
        setMemoryLimit(Number(data.memory_limit || 10));
      })
      .catch((err) => {
        console.error("Failed to fetch settings:", err);
        if (showToast) showToast("Failed to load settings", "error");
      });
  }, [showToast]);

  // ── Save Settings Handler ───────────────────────────────────────────────────
  async function saveContext() {
    setIsSaving(true);
    try {
      const settings = await fetch(`${API_BASE}/settings`).then((r) => r.json());

      settings.ai_context = context;
      settings.memory_enabled = String(memoryEnabled);
      settings.memory_limit = String(memoryLimit);

      await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (showToast) {
        showToast("AI Context and memory settings saved successfully");
      } else {
        alert("AI Context Saved");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      if (showToast) showToast("Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex items-center gap-3 mb-2">
        <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
          AI Profile & Context
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Context Card */}
        <div
          className={`lg:col-span-2 p-6 rounded-lg border shadow-sm space-y-4 ${
            darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/60"
          }`}
        >
          <div className="flex items-center gap-2 pb-2 border-b border-dashed ${darkMode ? 'border-[#2a3942]' : 'border-slate-100'}">
            <MessageSquare size={18} className="text-[#008069]" />
            <h2 className={`text-base font-semibold ${darkMode ? "text-white" : "text-slate-700"}`}>
              System Instructions
            </h2>
          </div>

          <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Define the core identity, knowledge bases, fallback guidelines, and stylistic controls for your global AI instance.
          </p>

          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={14}
            className={`${inputClass(darkMode)} font-mono text-xs leading-relaxed resize-none p-4`}
            placeholder={`You are Shubhanu's personal assistant.\nHe studies Data Science at college.\nKeep replies concise and conversational.`}
          />
        </div>

        {/* Right Sidebar: Memory Configuration & Actions */}
        <div className="space-y-6">
          {/* Memory Settings Card */}
          <div
            className={`p-6 rounded-lg border shadow-sm space-y-4 ${
              darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/60"
            }`}
          >
            <div className="flex items-center gap-2 pb-2 border-b border-dashed ${darkMode ? 'border-[#2a3942]' : 'border-slate-100'}">
              <Brain size={18} className="text-violet-400" />
              <h2 className={`text-base font-semibold ${darkMode ? "text-white" : "text-slate-700"}`}>
                Memory Engine
              </h2>
            </div>

            {/* Checkbox Toggle */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-emerald-500/10 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={memoryEnabled}
                onChange={(e) => setMemoryEnabled(e.target.checked)}
                className="mt-1 accent-[#008069] h-4 w-4 rounded"
              />
              <div className="space-y-0.5">
                <span className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                  Enable Contextual Memory
                </span>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Allows the agent to retain thread history during conversations.
                </p>
              </div>
            </label>

            {/* Sliding Window Number Field */}
            <div className={`pt-2 space-y-2 ${!memoryEnabled ? "opacity-40 pointer-events-none transition-opacity" : "transition-opacity"}`}>
              <label className={`block text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Conversation History Window
              </label>
              
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className={`${inputClass(darkMode)} w-24 text-center font-semibold`}
                />
                <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  messages back log
                </span>
              </div>
            </div>
          </div>

          {/* Persistent Action Panel */}
          <button
            type="button"
            disabled={isSaving}
            onClick={saveContext}
            className="w-full h-12 bg-[#008069] hover:bg-[#006e5a] active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-700/10"
          >
            <Save size={16} />
            {isSaving ? "Saving Config..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}