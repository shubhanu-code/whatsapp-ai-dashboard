import { useState } from "react";
import { Plus, Trash2, Users, Bot } from "lucide-react";
import { API_BASE } from "../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputClass(darkMode) {
  return `w-full px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm transition-all placeholder-slate-400 border ${
    darkMode
      ? "bg-[#202c33] border-[#2a3942] text-white"
      : "bg-slate-50/50 border-slate-200"
  }`;
}

function labelClass(darkMode) {
  return `block text-xs font-semibold mb-1.5 uppercase tracking-wider ${
    darkMode ? "text-slate-300" : "text-slate-500"
  }`;
}

function cardClass(darkMode) {
  return `p-5 rounded-lg shadow-sm border ${
    darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/60"
  }`;
}

function Field({ label, darkMode, children }) {
  return (
    <div>
      <label className={labelClass(darkMode)}>{label}</label>
      {children}
    </div>
  );
}

// ── API ───────────────────────────────────────────────────────────────────────

async function persistRules(rules) {
  const res = await fetch(`${API_BASE}/rules`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(rules),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Rules({ rules = [], setRules, contacts = [], darkMode }) {
  const [keyword,       setKeyword]       = useState("");
  const [matchType,     setMatchType]     = useState("contains");
  const [targetContact, setTargetContact] = useState("all");
  const [reply,         setReply]         = useState("");

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleAddRule(e) {
    e.preventDefault();
    if (!keyword.trim() || !reply.trim()) return;

    const newRule = {
      id:            Date.now().toString(),
      keyword:       keyword.trim().toLowerCase(),
      matchType,
      targetContact,
      reply:         reply.trim(),
      isActive:      true,
    };

    // Keep an immutable reference of the snapshot before updating for reversion
    const previousRules = [...rules];

    // Functional update guarantees execution on top of the freshest state stack
    setRules((prev) => [...prev, newRule]);
    
    // Clear form layout for optimistic UI speed
    setKeyword("");
    setReply("");
    setTargetContact("all");

    try {
      // Create the payload using functional resolution data state
      await persistRules([...previousRules, newRule]);
    } catch (err) {
      console.error("Error saving rule:", err);
      
      // Rollback UI to the explicit context step
      setRules(previousRules);
      setKeyword(newRule.keyword);
      setReply(newRule.reply);
      setTargetContact(newRule.targetContact);
      alert("Failed to save the rule. Please check your connection and try again.");
    }
  }

  async function toggleRule(id) {
    let originalRules = [];
    
    setRules((prev) => {
      originalRules = prev;
      return prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
    });

    try {
      // Re-map against snapshot data execution safely
      const targetState = originalRules.map((r) =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      );
      await persistRules(targetState);
    } catch (err) {
      console.error("Failed to toggle rule:", err);
      setRules(originalRules); 
    }
  }

  async function deleteRule(id) {
    let originalRules = [];

    setRules((prev) => {
      originalRules = prev;
      return prev.filter((r) => r.id !== id);
    });

    try {
      const targetState = originalRules.filter((r) => r.id !== id);
      await persistRules(targetState);
    } catch (err) {
      console.error("Failed to delete rule:", err);
      setRules(originalRules);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const safeRules = Array.isArray(rules) ? rules : [];
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Page title */}
      <h1 className={`text-3xl font-bold mb-8 ${darkMode ? "text-white" : "text-slate-800"}`}>
        Auto-Reply Rules
      </h1>

      {/* ── Create rule form ─────────────────────────────────────────────────── */}
      <div className={cardClass(darkMode)}>
        <h3 className={`text-[15px] font-semibold mb-4 ${darkMode ? "text-white" : "text-slate-700"}`}>
          Create New Rule
        </h3>

        <form onSubmit={handleAddRule} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Field label="Trigger Keyword" darkMode={darkMode}>
              <input
                type="text"
                placeholder="e.g. 'pricing' or 'hi'"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className={inputClass(darkMode)}
              />
            </Field>

            <Field label="Match Type" darkMode={darkMode}>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
                className={`${inputClass(darkMode)} cursor-pointer`}
              >
                <option value="exact">Exact Match</option>
                <option value="contains">Contains Word</option>
              </select>
            </Field>

            <Field label="Condition (Who to reply to)" darkMode={darkMode}>
              <select
                value={targetContact}
                onChange={(e) => setTargetContact(e.target.value)}
                className={`${inputClass(darkMode)} cursor-pointer`}
              >
                <option value="all">Everyone (All Contacts & Unknown)</option>
                {safeContacts.map((c) => (
                  <option key={c.phoneNumber} value={c.phoneNumber}>
                    Only {c.name}
                  </option>
                ))}
              </select>
            </Field>

          </div>

          <Field label="Auto-Reply Message" darkMode={darkMode}>
            <textarea
              placeholder="Type the message the bot will send..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              className={inputClass(darkMode)}
            />
          </Field>

          <button
            type="submit"
            className="bg-[#008069] hover:bg-[#006e5a] active:scale-[0.98] text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm w-full md:w-auto"
          >
            <Plus size={16} />
            Save Rule
          </button>
        </form>
      </div>

      {/* ── Rules list ───────────────────────────────────────────────────────── */}
      <div className="grid gap-3.5">
        {safeRules.length === 0 ? (
          <div
            className={`p-10 text-center rounded-lg border text-sm font-medium ${
              darkMode
                ? "bg-[#111b21] border-[#202c33] text-slate-400"
                : "bg-white border-slate-200/60 text-slate-400"
            }`}
          >
            No active rules. Create one to start automating replies.
          </div>
        ) : (
          safeRules.map((rule) => {
            const targetName =
              rule.targetContact === "all"
                ? "Everyone"
                : safeContacts.find((c) => c.phoneNumber === rule.targetContact)?.name ?? "Unknown Contact";

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all border ${
                  darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/60"
                } ${!rule.isActive ? "opacity-55 grayscale-[30%]" : ""}`}
              >
                {/* Rule details */}
                <div className="flex-1 space-y-2.5 w-full">

                  {/* Keyword + target badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-emerald-50 text-[#008069] px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-100 font-mono">
                      IF {rule.matchType === "exact" ? "EXACT" : "CONTAINS"}: "{rule.keyword}"
                    </span>

                    <span
                      className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                        darkMode
                          ? "bg-[#111b21] border-[#2a3942] text-slate-200"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Users size={12} className={darkMode ? "text-emerald-400" : "text-slate-500"} />
                      Applies to:&nbsp;
                      <b className={darkMode ? "text-white" : "text-slate-700"}>{targetName}</b>
                    </span>
                  </div>

                  {/* Reply preview */}
                  <div
                    className={`p-3 rounded-xl text-[14px] flex gap-2.5 border ${
                      darkMode
                        ? "bg-[#202c33] text-white border-[#2a3942]"
                        : "bg-[#f0f2f5]/70 text-[#111b21] border-slate-100"
                    }`}
                  >
                    <Bot size={16} className="text-[#008069] shrink-0 mt-0.5" />
                    <p className="italic">"{rule.reply}"</p>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className={`flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 mt-1 md:mt-0 ${
                    darkMode ? "border-[#2a3942]" : "border-slate-100"
                  }`}
                >
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 ${
                      rule.isActive
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200/40"
                        : "bg-emerald-50 text-[#008069] hover:bg-emerald-100/80 border border-emerald-200/40"
                    }`}
                  >
                    {rule.isActive ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 active:scale-95 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}