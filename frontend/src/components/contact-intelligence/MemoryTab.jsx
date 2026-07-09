// ─── Primitive Components ─────────────────────────────────────────────────────

function Field({ label, value, darkMode, multiline = false }) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        darkMode
          ? "bg-[#111b21] border-[#202c33]"
          : "bg-white border-slate-200"
      }`}
    >
      <div className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-[#8696a0]" : "text-slate-400"}`}>
        {label}
      </div>
      <div
        className={`mt-2 text-sm ${
          multiline ? "whitespace-pre-wrap leading-relaxed" : "truncate"
        } ${darkMode ? "text-[#e9edef]" : "text-slate-700"}`}
      >
        {value || "Not available"}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MemoryTab({ data, darkMode }) {
  const memory = data?.memory || {};

  const formattedDate = memory.updatedAt
    ? new Date(memory.updatedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Not tracked yet";

  const isEnabled = Boolean(memory.enabled || memory.status === "active");

  return (
    <div className="space-y-4">
      {/* Meta Properties Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Relationship" value={memory.relationship} darkMode={darkMode} />
        <Field label="Memory Enabled" value={isEnabled ? "Yes" : "No"} darkMode={darkMode} />
        <Field label="Updated At" value={formattedDate} darkMode={darkMode} />
      </div>

      {/* Profile Details */}
      <Field
        label="AI Profile"
        value={memory.profile || "No contact-specific profile has been added."}
        darkMode={darkMode}
        multiline
      />

      {/* Global Context Block */}
      <Field
        label="Global Context"
        value={memory.globalContext || "Global context is not included in this response yet."}
        darkMode={darkMode}
        multiline
      />
    </div>
  );
}