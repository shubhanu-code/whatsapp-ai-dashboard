import { useState } from "react";
import { BarChart3, Plus, Trash2, Edit3, User } from "lucide-react";
import { API_BASE } from "../services/api";
import ContactIntelligenceModal from "../components/contact-intelligence/ContactIntelligenceModal";

// ── Constants ─────────────────────────────────────────────────────────────────

const RELATIONSHIPS = [
  "Unknown",
  "Mother",
  "Father",
  "Brother",
  "Sister",
  "College Friend",
  "Classmate",
  "Faculty",
  "Recruiter",
];

const RELATIONSHIP_COLORS = {
  mother:          "border-emerald-500 text-emerald-400",
  father:          "border-emerald-500 text-emerald-400",
  brother:         "border-cyan-500 text-cyan-400",
  sister:          "border-cyan-500 text-cyan-400",
  "college friend":"border-sky-500 text-sky-400",
  classmate:       "border-sky-500 text-sky-400",
  faculty:         "border-violet-500 text-violet-400",
  recruiter:       "border-amber-500 text-amber-400",
};

function getRelationshipColor(relationship) {
  return RELATIONSHIP_COLORS[relationship?.toLowerCase()] ?? "border-slate-500 text-slate-400";
}

// ── Reusable helpers ──────────────────────────────────────────────────────────

function inputClass(darkMode, extra = "") {
  return `w-full px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm transition-all border ${
    darkMode
      ? "bg-[#202c33] border-[#2a3942] text-white"
      : "bg-slate-50/50 border-slate-200"
  } ${extra}`;
}

function modalInputClass(darkMode) {
  return `w-full px-4 py-2 border rounded-xl ${
    darkMode
      ? "bg-[#202c33] text-white border-[#2a3942]"
      : "bg-white border-slate-300"
  }`;
}

/** Dropdown shared between the add form and the table relationship column. */
function RelationshipSelect({ value, onChange, className }) {
  return (
    <select value={value} onChange={onChange} className={className}>
      {RELATIONSHIPS.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditModal({ contact, onSave, onClose, darkMode }) {
  const [draft,     setDraft]     = useState(contact);
  const [activeTab, setActiveTab] = useState("basic");

  function update(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const tabBtn = (id, label) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      className={`px-3 py-2 rounded-lg text-sm transition-all ${
        activeTab === id
          ? "bg-[#008069] text-white"
          : darkMode
          ? "bg-[#202c33] text-slate-300 hover:bg-[#2a3942]"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className={`rounded-2xl p-6 w-full max-w-md shadow-xl ${
          darkMode ? "bg-[#111b21] text-white" : "bg-white text-slate-800"
        }`}
      >
        <h3 className="text-lg font-semibold mb-4">Edit Contact</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabBtn("basic", "Basic")}
          {tabBtn("ai",    "AI Profile")}
        </div>

        <div className="space-y-4">
          {/* Basic tab */}
          {activeTab === "basic" && (
            <>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Name"
                className={modalInputClass(darkMode)}
              />
              <input
                type="text"
                value={draft.phoneNumber || ""}
                onChange={(e) => update("phoneNumber", e.target.value)}
                placeholder="Phone Number"
                className={modalInputClass(darkMode)}
              />
            </>
          )}

          {/* AI Profile tab */}
          {activeTab === "ai" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Profile</label>

              <textarea
                rows={8}
                value={draft.aiContext || ""}
                onChange={(e) => update("aiContext", e.target.value)}
                placeholder={"Father\n\nDiscusses academics and finances.\n\nKeep replies respectful and concise."}
                className={`${modalInputClass(darkMode)} resize-none p-3`}
              />

              <div
                className={`text-xs rounded-lg p-3 ${
                  darkMode ? "bg-[#202c33] text-slate-400" : "bg-slate-50 text-slate-500"
                }`}
              >
                Example:<br />
                Relationship: Father<br />
                Preferred tone: Respectful<br />
                Topics: Academics, finances
              </div>

              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Personalized instructions used only for this contact.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl transition-all ${
                darkMode
                  ? "bg-[#202c33] text-slate-300 hover:bg-[#2a3942]"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              className="px-4 py-2 rounded-xl bg-[#008069] hover:bg-[#006e5a] transition-colors text-white font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Contacts({ contacts, setContacts, rules, setRules, showToast, darkMode }) {
  const [name,           setName]           = useState("");
  const [phone,          setPhone]          = useState("");
  const [relationship,   setRelationship]   = useState("Unknown");
  const [editingContact, setEditingContact] = useState(null);
  const [insightContact, setInsightContact] = useState(null);

  // ── API helpers ─────────────────────────────────────────────────────────────

  async function saveContacts(updated) {
    await fetch(`${API_BASE}/contacts`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(updated),
    });
  }

  async function saveRulesRemote(updated) {
    await fetch(`${API_BASE}/rules`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(updated),
    });
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleAdd(e) {
    e.preventDefault();
    if (!name || !phone) return;

    const duplicate = contacts.find(
      (c) =>
        c.phoneNumber === phone ||
        c.name.toLowerCase() === name.toLowerCase(),
    );

    if (duplicate) {
      showToast("Contact already exists", "error");
      return;
    }

    const updated = [
      ...contacts,
      {
        phoneNumber: phone,
        waJid:       null,
        waLid:       null,
        name,
        relationship,
        botEnabled:  false,
        createdAt:   new Date().toISOString(),
      },
    ];

    setContacts(updated);
    await saveContacts(updated);
    showToast("Contact added successfully");

    setName("");
    setPhone("");
    setRelationship("Unknown");
  }

  async function handleDelete(id) {
    const updatedContacts = contacts.filter((c) => c.phoneNumber !== id);
    const updatedRules    = rules.map((r) =>
      r.targetContact === id ? { ...r, targetContact: "all" } : r,
    );

    try {
      setContacts(updatedContacts);
      setRules(updatedRules);
      await Promise.all([saveContacts(updatedContacts), saveRulesRemote(updatedRules)]);
      showToast("Contact deleted successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete contact", "error");
    }
  }

  async function toggleBot(id) {
    const updated = contacts.map((c) =>
      c.phoneNumber === id ? { ...c, botEnabled: !c.botEnabled } : c,
    );

    // Read the current state before updating so the toast is accurate
    const wasEnabled = contacts.find((c) => c.phoneNumber === id)?.botEnabled;

    try {
      setContacts(updated);
      await saveContacts(updated);
      showToast(wasEnabled ? "Bot disabled successfully" : "Bot enabled successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to update bot status", "error");
    }
  }

  async function updateRelationship(contactId, rel) {
    const updated = contacts.map((c) =>
      c.phoneNumber === contactId ? { ...c, relationship: rel } : c,
    );
    setContacts(updated);
    await saveContacts(updated);
  }

  async function handleSaveEdit(draft) {
    const updated = contacts.map((c) =>
      c.phoneNumber === draft.originalPhoneNumber ? draft : c,
    );
    setContacts(updated);
    await saveContacts(updated);
    showToast("Contact updated");
    setEditingContact(null);
  }

  // ── Shared class strings ────────────────────────────────────────────────────

  const thClass = `px-6 py-3.5 font-semibold text-xs uppercase tracking-wider ${
    darkMode ? "bg-[#172229]" : "bg-slate-50"
  }`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Page title */}
      <h1 className={`text-3xl font-bold mb-8 ${darkMode ? "text-white" : "text-slate-800"}`}>
        Contact Manager
      </h1>

      {/* ── Add contact form ────────────────────────────────────────────────── */}
      <div
        className={`p-5 rounded-lg border shadow-sm ${
          darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/60"
        }`}
      >
        <h3
          className={`text-[15px] font-semibold mb-4 ${
            darkMode ? "text-white" : "text-slate-700"
          }`}
        >
          Add New Contact
        </h3>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Contact Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass(darkMode)}
            />
          </div>

          <div className="md:col-span-4">
            <input
              type="text"
              placeholder="Phone Number (e.g. 1234567890)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass(darkMode)}
            />
          </div>

          <div className="md:col-span-3">
            <RelationshipSelect
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className={inputClass(darkMode)}
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-full min-h-[44px] bg-[#008069] hover:bg-[#006e5a] active:scale-[0.98] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-700/10"
            >
              <Plus size={16} />
              Add Contact
            </button>
          </div>
        </form>

        <p className="text-xs mt-2 text-slate-500">
          Contacts are linked automatically when they message you on WhatsApp.
        </p>
      </div>

      {/* ── Contacts table ───────────────────────────────────────────────────── */}
      <div
        className={`rounded-lg border shadow-sm overflow-hidden ${
          darkMode ? "bg-[#111b21] border-[#202c33]" : "bg-white border-slate-200/60"
        }`}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className={`border-b ${
                darkMode ? "bg-[#202c33] border-[#2a3942]" : "bg-slate-50/70 border-slate-100"
              }`}
            >
              <th className={thClass}>Name</th>
              <th className={thClass}>Phone Number</th>
              <th className={thClass}>Relationship</th>
              <th className={thClass}>Bot</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>

          <tbody className={`divide-y ${darkMode ? "divide-[#202c33]" : "divide-slate-100"}`}>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400 font-medium">
                  No contacts found. Add one above.
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr
                  key={c.phoneNumber}
                  className={`transition-colors ${
                    darkMode ? "hover:bg-[#202c33]" : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* Name */}
                  <td
                    className={`px-6 py-3.5 text-sm font-medium ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          darkMode ? "bg-[#202c33] text-emerald-400" : "bg-emerald-50 text-[#008069]"
                        }`}
                      >
                        <User size={15} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.aiContext?.trim() && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-violet-500/15 text-violet-400">
                            Context Provided
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td
                    className={`px-6 py-3.5 text-sm font-mono ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {c.phoneNumber || "-"}
                  </td>

                  {/* Relationship */}
                  <td className="px-6 py-3.5">
                    <RelationshipSelect
                      value={c.relationship || "Unknown"}
                      onChange={(e) => updateRelationship(c.phoneNumber, e.target.value)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${getRelationshipColor(c.relationship)} ${
                        darkMode ? "bg-[#202c33]" : "bg-white"
                      }`}
                    />
                  </td>

                  {/* Bot toggle */}
                  <td className="px-6 py-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleBot(c.phoneNumber);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        c.botEnabled
                          ? darkMode
                            ? "bg-green-900/20 text-green-300"
                            : "bg-green-100 text-green-700"
                          : darkMode
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.botEnabled ? "ON" : "OFF"}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setInsightContact(c)}
                        aria-label={`Open intelligence for ${c.name || c.phoneNumber}`}
                        title="Contact intelligence"
                        className={`p-2 rounded-xl text-emerald-500 transition-all ${
                          darkMode
                            ? "hover:bg-[#202c33] hover:text-emerald-400"
                            : "hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        <BarChart3 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingContact({ ...c, originalPhoneNumber: c.phoneNumber })
                        }
                        className={`p-2 rounded-xl text-blue-500 transition-all ${
                          darkMode
                            ? "hover:bg-[#202c33] hover:text-blue-400"
                            : "hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(c.phoneNumber)}
                        className={`p-2 rounded-xl text-rose-500 transition-all ${
                          darkMode
                            ? "hover:bg-[#202c33] hover:text-rose-400"
                            : "hover:bg-rose-50 hover:text-rose-700"
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Edit modal ───────────────────────────────────────────────────────── */}
      {editingContact && (
        <EditModal
          contact={editingContact}
          onSave={handleSaveEdit}
          onClose={() => setEditingContact(null)}
          darkMode={darkMode}
        />
      )}

      {insightContact && (
        <ContactIntelligenceModal
          contact={insightContact}
          onClose={() => setInsightContact(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
