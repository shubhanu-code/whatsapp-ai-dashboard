function Field({ label, value, darkMode, multiline = false }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        darkMode
          ? "bg-[#111b21] border-[#202c33]"
          : "bg-white border-slate-200"
      }`}
    >
      <div className={`text-xs font-medium uppercase ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </div>
      <div
        className={`mt-2 text-sm ${
          multiline ? "whitespace-pre-wrap leading-6" : ""
        } ${darkMode ? "text-slate-200" : "text-slate-700"}`}
      >
        {value || "Not available"}
      </div>
    </div>
  );
}

export default function MemoryTab({ data, darkMode }) {
  const memory = data?.memory || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Relationship" value={memory.relationship} darkMode={darkMode} />
        <Field label="Memory Enabled" value={memory.enabled ? "Yes" : "No"} darkMode={darkMode} />
        <Field label="Updated At" value={memory.updatedAt || "Not tracked yet"} darkMode={darkMode} />
      </div>

      <Field
        label="AI Profile"
        value={memory.profile || "No contact-specific profile has been added."}
        darkMode={darkMode}
        multiline
      />

      <Field
        label="Global Context"
        value={memory.globalContext || "Global context is not included in this response yet."}
        darkMode={darkMode}
        multiline
      />
    </div>
  );
}
