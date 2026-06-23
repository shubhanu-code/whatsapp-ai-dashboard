import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  User
} from "lucide-react";

import { API_BASE } from "../services/api";
export default function Contacts({ contacts, setContacts, rules, setRules,showToast,darkMode }){
  console.log("CONTACTS DATA:", contacts);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [activeContactTab,setActiveContactTab] =useState("basic");
  
  const [relationship, setRelationship] = useState('Unknown');
  const saveContacts = async (updatedContacts) => {
    const response = await fetch(
      `${API_BASE}/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedContacts)
      }
    );

  };


  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    const existing = contacts.find(
      c =>
        c.phoneNumber === phone ||
        c.name.toLowerCase() ===
        name.toLowerCase()
    );

    if (existing) {
      showToast(
        "Contact already exists",
        "error"
      );
      return;
    }
    const updatedContacts = [
      ...contacts,
      {
        phoneNumber: phone,
        waJid: null,
        waLid: null,
        name,
        relationship,
        botEnabled: false,
        createdAt: new Date().toISOString()
      }
    ];
    setContacts(updatedContacts);
    await saveContacts(updatedContacts);
    showToast(
      "Contact added successfully"
    );
    setName('');
    setPhone('');
    setRelationship('Unknown');
  };

  const handleDelete = async (id) => {
    const updatedContacts = contacts.filter(
        c => c.phoneNumber !== id
    );

    const updatedRules = rules.map(
        r =>
        r.targetContact === id
            ? { ...r, targetContact: "all" }
            : r
    );

    try {

        setContacts(updatedContacts);
        setRules(updatedRules);

        await Promise.all([
        saveContacts(updatedContacts),
        fetch(`${API_BASE}/rules`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedRules)
        })
        ]);

        showToast(
        "Contact deleted successfully"
        );

    } catch (err) {

        console.error(err);

        showToast(
        "Failed to delete contact",
        "error"
        );

    }
    };

  const toggleBot = async (id) => {

    const updated = contacts.map(c =>
        c.phoneNumber === id
        ? { ...c, botEnabled: !c.botEnabled }
        : c
    );

    try {

        setContacts(updated);

        await Promise.all([
        saveContacts(updated),
        ]);

        const contact = contacts.find(
        c => c.phoneNumber === id
        );

        showToast(
        contact?.botEnabled
            ? "Bot disabled successfully"
            : "Bot enabled successfully"
        );

    } catch (err) {

        console.error(err);

        showToast(
        "Failed to update bot status",
        "error"
        );

    }
    };
  const updateRelationship = async (
    contactId,
    relationship
  ) => {

    const updatedContacts =
      contacts.map(contact =>
        contact.phoneNumber === contactId
          ? {
              ...contact,
              relationship
            }
          : contact
      );

    setContacts(updatedContacts);

    await saveContacts(
      updatedContacts
    );

  };
  const saveEditedContact = async () => {

    const updatedContacts = contacts.map(contact =>
      contact.phoneNumber === editingContact.phoneNumber
        ? editingContact
        : contact
    );

    setContacts(updatedContacts);

    await saveContacts(updatedContacts);
    showToast(
      "Contact updated"
    );

    setEditingContact(null);

  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h1
        className={`
          text-3xl
          font-bold
          mb-8
          ${
            darkMode
              ? "text-white"
              : "text-slate-800"
          }
        `}
      >
        Contact Manager
      </h1>

      <div
        className={`
          p-5
          rounded-lg
          border
          shadow-sm
          ${
            darkMode
              ? "bg-[#111b21] border-[#202c33]"
              : "bg-white border-slate-200/60"
          }
        `}
      >
        <h3
          className={`
            text-[15px]
            font-semibold
            mb-4
            ${
              darkMode
                ? "text-white"
                : "text-slate-700"
            }
          `}
        >Add New Contact</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Contact Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`
                w-full
                px-4
                py-2.5
                rounded-xl
                focus:ring-4
                focus:ring-emerald-500/10
                focus:border-[#008069]
                outline-none
                text-sm
                transition-all
                ${
                  darkMode
                    ? "bg-[#202c33] border border-[#2a3942] text-white"
                    : "bg-slate-50/50 border border-slate-200"
                }
              `}
            />
          </div>
          <div className="md:col-span-4">
            <input
              type="text"
              placeholder="Phone Number (e.g. 1234567890)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`
                w-full
                px-4
                py-2.5
                rounded-xl
                focus:ring-4
                focus:ring-emerald-500/10
                focus:border-[#008069]
                outline-none
                text-sm
                transition-all
                ${
                  darkMode
                    ? "bg-[#202c33] border border-[#2a3942] text-white"
                    : "bg-slate-50/50 border border-slate-200"
                }
              `}
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className={`
                w-full
                px-4
                py-2.5
                rounded-xl
                focus:ring-4
                focus:ring-emerald-500/10
                focus:border-[#008069]
                outline-none
                text-sm
                transition-all
                ${
                  darkMode
                    ? "bg-[#202c33] border border-[#2a3942] text-white"
                    : "bg-slate-50/50 border border-slate-200"
                }
              `}
            >
              <option value="Unknown">Unknown</option>
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Brother">Brother</option>
              <option value="Sister">Sister</option>
              <option value="College Friend">College Friend</option>
              <option value="Classmate">Classmate</option>
              <option value="Faculty">Faculty</option>
              <option value="Recruiter">Recruiter</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="
                w-full
                h-full
                min-h-[44px]
                bg-[#008069]
                hover:bg-[#006e5a]
                active:scale-[0.98]
                text-white
                rounded-xl
                text-sm
                font-semibold
                flex items-center justify-center gap-2
                transition-all
                shadow-sm shadow-emerald-700/10
              "
            >
              <Plus size={16} />
              Add Contact
            </button>
          </div>
        </form>
        <p className="text-xs text-slate-500 mt-2">
          Contacts are linked automatically when they message you on WhatsApp.
        </p>
      </div>

      <div
        className={`
          rounded-lg
          border
          shadow-sm
          overflow-hidden
          ${
            darkMode
              ? "bg-[#111b21] border-[#202c33]"
              : "bg-white border-slate-200/60"
          }
        `}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className={`
                border-b
                ${
                  darkMode
                    ? "bg-[#202c33] border-[#2a3942]"
                    : "bg-slate-50/70 border-slate-100"
                }
              `}
            >
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Phone Number</th>
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Relationship</th>
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Bot</th>
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 font-medium">No contacts found. Add one above.</td>
              </tr>
            ) : contacts.map(c => (
              <tr
                key={c.phoneNumber}
                className={`
                  transition-colors
                  ${
                    darkMode
                      ? "hover:bg-[#202c33]"
                      : "hover:bg-slate-50/80"
                  }
                `}
              >
                <td
                  className={`
                    px-6
                    py-3.5
                    text-sm
                    font-medium
                    ${
                      darkMode
                        ? "text-white"
                        : "text-slate-800"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-8
                        h-8
                        rounded-full
                        flex
                        items-center
                        justify-center
                        font-semibold
                        ${
                          darkMode
                            ? "bg-[#202c33] text-emerald-400"
                            : "bg-emerald-50 text-[#008069]"
                        }
                      `}
                    >
                      <User size={15} />
                    </div>
                    {c.name}
                  </div>
                </td>

                <td className="px-6 py-3.5 text-sm text-slate-600 font-mono">
                  {c.phoneNumber || "-"}
                </td>

                <td className="px-6 py-3.5">

                  <select
                    value={c.relationship || "Unknown"}
                    onChange={(e) =>
                      updateRelationship(
                        c.phoneNumber,
                        e.target.value
                      )
                    }
                    className={`
                      px-2
                      py-1
                      border
                      rounded-lg
                      text-sm
                      ${
                        darkMode
                          ? "bg-[#202c33] text-white border-[#2a3942]"
                          : "bg-white text-slate-800 border-slate-200"
                      }
                    `}
                  >

                    <option value="Unknown" className={darkMode ? "bg-[#202c33] text-white" : "bg-white text-slate-800"}>
                      Unknown
                    </option>

                    <option value="Mother" className={darkMode ? "bg-[#202c33] text-white" : "bg-white text-slate-800"}>
                      Mother
                    </option>

                    <option value="Father" className={darkMode ? "bg-[#202c33] text-white" : "bg-white text-slate-800"}>
                      Father
                    </option>

                    <option value="Brother" className={darkMode ? "bg-[#202c33] text-white" : "bg-white text-slate-800"}>
                      Brother
                    </option>

                    <option value="Sister" className={darkMode ? "bg-[#202c33] text-white" : "bg-white text-slate-800"}>
                      Sister
                    </option>

                    <option value="College Friend" className={darkMode ? "bg-[#202c33] text-white" : "bg-white text-slate-800"}>
                      College Friend
                    </option>

                    <option value="Classmate" className={darkMode ? "bg-[#202c33] text-white" : "bg-white text-slate-800"}>
                      Classmate
                    </option>

                    <option value="Faculty" className={darkMode ? "bg-[#202c33] text-white" : "bg-white text-slate-800"}>
                      Faculty
                    </option>

                    <option value="Recruiter" className={darkMode ? "bg-[#202c33] text-white" : "bg-white text-slate-800"}>
                      Recruiter
                    </option>

                  </select>

                </td>

                <td className="px-6 py-3.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleBot(c.phoneNumber);
                    }}
                    className={`
                      px-3
                      py-1
                      rounded-full
                      text-xs
                      font-medium
                      ${
                        c.botEnabled
                          ? (
                              darkMode
                                ? "bg-green-900/20 text-green-300"
                                : "bg-green-100 text-green-700"
                            )
                          : (
                              darkMode
                                ? "bg-slate-800 text-slate-300"
                                : "bg-slate-100 text-slate-500"
                            )
                      }
                    `}
                  >
                    {c.botEnabled ? "ON" : "OFF"}
                  </button>
                </td>

                <td className="px-6 py-3.5 text-right">
                  <div className="flex justify-end gap-2">
                    
                    <button
                      type="button"
                      onClick={() => setEditingContact(c)}
                      className="text-blue-500 hover:text-blue-700 p-2 rounded-xl hover:bg-blue-50"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(c.phoneNumber)}
                      className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        {editingContact && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

              <h3 className="text-lg font-semibold mb-4">
                Edit Contact
              </h3>
              <div className="flex gap-2 mb-4">

              <button
                onClick={() =>
                  setActiveContactTab("basic")
                }
                className={`
                  px-3 py-2 rounded-lg text-sm
                  ${
                    activeContactTab === "basic"
                      ? "bg-[#008069] text-white"
                      : "bg-slate-100"
                  }
                `}
              >
                Basic
              </button>

              <button
                onClick={() =>
                  setActiveContactTab("ai")
                }
                className={`
                  px-3 py-2 rounded-lg text-sm
                  ${
                    activeContactTab === "ai"
                      ? "bg-[#008069] text-white"
                      : "bg-slate-100"
                  }
                `}
              >
                AI Profile
              </button>

            </div>

              <div className="space-y-4">

                {activeContactTab === "basic" && (
                  <>
                    <input
                      type="text"
                      value={editingContact.name}
                      onChange={(e) =>
                        setEditingContact({
                          ...editingContact,
                          name: e.target.value
                        })
                      }
                      placeholder="Name"
                      className="w-full px-4 py-2 border rounded-xl"
                    />

                    <input
                      type="text"
                      value={editingContact.phoneNumber || ""}
                      onChange={(e) =>
                        setEditingContact({
                          ...editingContact,
                          phoneNumber: e.target.value
                        })
                      }
                      placeholder="Phone Number"
                      className="w-full px-4 py-2 border rounded-xl"
                    />
                  </>
                )}

                {activeContactTab === "ai" && (
                  <div className="space-y-3">

                    <label className="text-sm font-medium">
                      AI Context
                    </label>

                    <textarea
                      rows={8}
                      value={
                        editingContact.aiContext || ""
                      }
                      onChange={(e) =>
                        setEditingContact({
                          ...editingContact,
                          aiContext: e.target.value
                        })
                      }
                      placeholder={`Father.

              Discusses academics and finances.

              Keep replies respectful and concise.`}
                      className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        resize-none
                      "
                    />

                  </div>
                )}

                <div className="flex justify-end gap-3">

                  <button
                    onClick={() =>
                      setEditingContact(null)
                    }
                    className="px-4 py-2 rounded-xl bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={saveEditedContact}
                    className="px-4 py-2 rounded-xl bg-[#008069] text-white"
                  >
                    Save
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

        
    </div>
  );
}