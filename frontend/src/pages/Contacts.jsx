import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  User
} from "lucide-react";

import { API_BASE } from "../services/api";
export default function Contacts({ contacts, setContacts, rules, setRules,showToast }){
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [linkingContact, setLinkingContact] = useState(null);
  const [unlinkingContact, setUnlinkingContact] = useState(null);
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

  const saveAllowedContacts = async (updatedContacts) => {
    const allowed = updatedContacts
      .filter(c => c.botEnabled && c.whatsappId)
      .map(c => c.whatsappId);

    await fetch(
      `${API_BASE}/allowed-contacts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(allowed)
      }
    );
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    const existing = contacts.find(
      c =>
        c.phone === phone ||
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
        id: Date.now().toString(),
        name,
        phone,
        relationship,
        botEnabled: false        
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
    const updatedContacts = contacts.filter(c => c.id !== id);
    const updatedRules = rules.map(r => r.targetContact === id ? { ...r, targetContact: 'all' } : r);

    setContacts(updatedContacts);
    setRules(updatedRules);

    await Promise.all([
      saveContacts(updatedContacts),
      saveAllowedContacts(updatedContacts),
      fetch(`${API_BASE}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRules)
      })
    ]);
  };

  const toggleBot = async (id) => {
    const updated = contacts.map(c =>
      c.id === id ? { ...c, botEnabled: !c.botEnabled } : c
    );

    setContacts(updated);

    await Promise.all([
      saveContacts(updated),
      saveAllowedContacts(updated)
    ]);
    showToast(
      "Contact deleted"
    );
  };
  const updateRelationship = async (
    contactId,
    relationship
  ) => {

    const updatedContacts =
      contacts.map(contact =>
        contact.id === contactId
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
      contact.id === editingContact.id
        ? editingContact
        : contact
    );

    setContacts(updatedContacts);

    await saveContacts(updatedContacts);

    await saveAllowedContacts(updatedContacts);
    showToast(
      "Contact updated"
    );

    setEditingContact(null);

  };
  const linkContact = async (manualContactId) => {

    const manualContact =
      contacts.find(
        c => c.id === manualContactId
      );

    if (!manualContact || !linkingContact)
      return;

    const updatedContacts =
      contacts
        .filter(
          c => c.id !== linkingContact.id
        )
        .map(contact =>
          contact.id === manualContactId
            ? {
                ...contact,

                whatsappId:
                  linkingContact.whatsappId,
                whatsappName:
                  linkingContact.name,

                botEnabled:
                  contact.botEnabled ||
                  linkingContact.botEnabled,

                relationship:
                  contact.relationship !== "Unknown"
                    ? contact.relationship
                    : linkingContact.relationship
              }
            : contact
        );

    setContacts(updatedContacts);

    await saveContacts(
      updatedContacts
    );

    await saveAllowedContacts(
      updatedContacts
    );

    setLinkingContact(null);
    showToast(
      "Contact linked successfully"
    );

  };
  const unlinkContact = async (contactId) => {
    const contact =
      contacts.find(
        c => c.id === contactId
      );

    if (!contact) return;

    const whatsappContact = {
      id: Date.now().toString(),
      
      name: 
      contact.whatsappName ||
      contact.name,
      phone: "",
      whatsappId: contact.whatsappId,
      relationship: "Unknown",
      botEnabled: false
    };

    const updatedContacts = [
      ...contacts.map(c =>
        c.id === contactId
          ? {
              ...c,
              whatsappId: undefined
            }
          : c
      ),
      whatsappContact
    ];

    setContacts(updatedContacts);

    await saveContacts(updatedContacts);

    await saveAllowedContacts(
      updatedContacts
    );
    showToast(
      "Contact unlinked"
    );

  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight border-b border-slate-200 pb-4">Contact Manager</h2>

      <div className="bg-white p-5 rounded-lg border border-slate-200/60 shadow-sm">
        <h3 className="text-[15px] font-semibold text-slate-700 mb-4">Add New Contact</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Contact Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all placeholder-slate-400"
            />
          </div>
          <div className="md:col-span-4">
            <input
              type="text"
              placeholder="Phone Number (e.g. 1234567890)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all placeholder-slate-400"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#008069] outline-none text-sm bg-slate-50/50 transition-all"
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

      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Phone Number</th>
              <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</th>
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
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3.5 text-sm font-medium text-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#008069] flex items-center justify-center font-semibold">
                      <User size={15} />
                    </div>
                    {c.name}
                  </div>
                </td>

                <td className="px-6 py-3.5 text-sm text-slate-600 font-mono">
                  {c.phone || "-"}
                </td>
                <td className="px-6 py-3.5">

                  {c.whatsappId && c.phone ? (

                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      Linked
                    </span>

                  ) : c.whatsappId ? (

                    <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                      Needs Linking
                    </span>

                  ) : (

                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      Manual
                    </span>

                  )}

                </td>

                <td className="px-6 py-3.5">

                  <select
                    value={c.relationship || "Unknown"}
                    onChange={(e) =>
                      updateRelationship(
                        c.id,
                        e.target.value
                      )
                    }
                    className="px-2 py-1 border border-slate-200 rounded-lg text-sm"
                  >

                    <option value="Unknown">
                      Unknown
                    </option>

                    <option value="Mother">
                      Mother
                    </option>

                    <option value="Father">
                      Father
                    </option>

                    <option value="Brother">
                      Brother
                    </option>

                    <option value="Sister">
                      Sister
                    </option>

                    <option value="College Friend">
                      College Friend
                    </option>

                    <option value="Classmate">
                      Classmate
                    </option>

                    <option value="Faculty">
                      Faculty
                    </option>

                    <option value="Recruiter">
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
                      toggleBot(c.id);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      c.botEnabled
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.botEnabled ? "ON" : "OFF"}
                  </button>
                </td>

                <td className="px-6 py-3.5 text-right">
                  <div className="flex justify-end gap-2">
                    {c.whatsappId && !c.phone && (
                      <button
                        type="button"
                        onClick={() => setLinkingContact(c)}
                        className="text-emerald-600 hover:text-emerald-700 p-2 rounded-xl hover:bg-emerald-50"
                      >
                        🔗
                      </button>
                    )}
                    {c.whatsappId && c.phone && (
                      <button
                        type="button"
                        onClick={() =>
                          setUnlinkingContact(c)
                        }
                        className="text-orange-600 hover:text-orange-700 p-2 rounded-xl hover:bg-orange-50"
                      >
                        🔓
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingContact(c)}
                      className="text-blue-500 hover:text-blue-700 p-2 rounded-xl hover:bg-blue-50"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
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

              <div className="space-y-4">

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
                  value={editingContact.phone || ""}
                  onChange={(e) =>
                    setEditingContact({
                      ...editingContact,
                      phone: e.target.value
                    })
                  }
                  placeholder="Phone Number"
                  className="w-full px-4 py-2 border rounded-xl"
                />

                <div className="flex justify-end gap-3">

                  <button
                    onClick={() => setEditingContact(null)}
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
        {linkingContact && (

          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

              <h3 className="text-lg font-semibold mb-4">
                Link WhatsApp Contact
              </h3>

              <p className="text-sm text-slate-600 mb-4">
                Link:
                <b>
                  {" "}
                  {linkingContact.name}
                  {" "}
                </b>
                to an existing contact.
              </p>

              <div className="space-y-2">

                {contacts
                  .filter(c => !c.whatsappId)
                  .map(contact => (

                    <button
                      key={contact.id}
                      onClick={() =>
                        linkContact(contact.id)
                      }
                      className="w-full text-left px-4 py-3 border rounded-xl hover:bg-slate-50"
                    >
                      <div className="font-medium">
                        {contact.name}
                      </div>

                      <div className="text-xs text-slate-500">
                        {contact.phone || "-"}
                      </div>

                    </button>

                  ))}

              </div>

              <div className="flex justify-end mt-4">

                <button
                  onClick={() =>
                    setLinkingContact(null)
                  }
                  className="px-4 py-2 rounded-xl bg-slate-100"
                >
                  Cancel
                </button>

              </div>

            </div>

          </div>

        )}
        {unlinkingContact && (

          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">

              <h3 className="text-lg font-semibold mb-3">
                Unlink Contact?
              </h3>

              <p className="text-sm text-slate-600">
                Are you sure you want to unlink
                <b>
                  {" "}
                  {unlinkingContact.name}
                </b>
                ?
              </p>

              <p className="text-xs text-slate-500 mt-2">
                This will create a separate
                WhatsApp contact that can be linked
                again later.
              </p>

              <div className="flex justify-end gap-3 mt-6">

                <button
                  onClick={() =>
                    setUnlinkingContact(null)
                  }
                  className="px-4 py-2 rounded-xl bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {

                    await unlinkContact(
                      unlinkingContact.id
                    );

                    setUnlinkingContact(null);

                  }}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                >
                  Unlink
                </button>

              </div>

            </div>

          </div>

        )}
        
    </div>
  );
}