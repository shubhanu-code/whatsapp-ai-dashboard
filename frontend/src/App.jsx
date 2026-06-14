import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Plus,
  Trash2,
  Edit3,
  Send,
  Bot,
  User,
  CheckCircle2,
  SquareCode,
  X
} from 'lucide-react';

import Inbox from "./pages/Inbox.jsx";
import Contacts from "./pages/Contacts.jsx";
import Rules from "./pages/Rules.jsx";
import Simulator from './pages/Simulator';
import Overview from "./pages/Overview";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const REPLY_MODES = new Set(['rules', 'ai', 'smart']);

const INITIAL_RULES = [];

const INITIAL_CONTACTS = [];


export default function App() {
  useEffect(() => {
    console.log("APP MOUNTED");
  }, []);
  const [activeTab, setActiveTab] = useState('overview');
  const [rules, setRules] = useState(INITIAL_RULES);
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [stats, setStats] = useState({ messagesSent: 0, messagesReceived: 0 });
  const [replyMode, setReplyMode] = useState("smart");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [rulesRes, contactsRes, allowedRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/rules`),
          fetch(`${API_BASE}/contacts`),
          fetch(`${API_BASE}/allowed-contacts`),
          fetch(`${API_BASE}/settings`)
        ]);

        const [savedRules, savedContacts, allowedContacts, savedSettings] = await Promise.all([
          rulesRes.json(),
          contactsRes.json(),
          allowedRes.json(),
          settingsRes.json()
        ]);

        if (Array.isArray(savedRules)) {
          setRules(savedRules);
        }

        const allowedSet = new Set(Array.isArray(allowedContacts) ? allowedContacts : []);
        const baseContacts = Array.isArray(savedContacts) && savedContacts.length > 0
          ? savedContacts
          : INITIAL_CONTACTS;

        setContacts(baseContacts.map(contact => ({
          ...contact,
          botEnabled: Boolean(contact.whatsappId && allowedSet.has(contact.whatsappId))
        })));

        if (REPLY_MODES.has(savedSettings?.replyMode)) {
          setReplyMode(savedSettings.replyMode);
        }
      } catch (err) {
        console.warn("Could not fetch dashboard data from backend:", err);
      }
    };

    loadDashboardData();
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'rules', label: 'Auto-Reply Rules', icon: SquareCode },
    { id: 'simulator', label: 'Chat Simulator', icon: Smartphone },
    { id: 'inbox', label: 'Inbox', icon: Send }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row font-sans text-slate-800 antialiased">
        {toast && (
          <div
            className="
              fixed top-5 right-5 z-[9999]
              animate-[slideIn_.25s_ease-out]
            "
          >
            <div
              className={`
                min-w-[320px]
                max-w-md
                px-4 py-3
                rounded-2xl
                shadow-xl
                border
                flex items-start gap-3
                backdrop-blur-sm
                ${
                  toast.type === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-emerald-50 border-emerald-200"
                }
              `}
            >

              <div className="mt-0.5">

                {toast.type === "error" ? (
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    ❌
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    ✅
                  </div>
                )}

              </div>

              <div className="flex-1">

                <div
                  className={`
                    text-sm font-semibold
                    ${
                      toast.type === "error"
                        ? "text-red-700"
                        : "text-emerald-700"
                    }
                  `}
                >
                  {toast.type === "error"
                    ? "Error"
                    : "Success"}
                </div>

                <div
                  className={`
                    text-sm mt-0.5
                    ${
                      toast.type === "error"
                        ? "text-red-600"
                        : "text-emerald-600"
                    }
                  `}
                >
                  {toast.message}
                </div>

              </div>

              <button
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>

            </div>
          </div>
        )}
      
      {/* Mobile Header Block */}
      <div className="md:hidden bg-[#075e54] text-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 font-bold text-base tracking-tight">
          <Bot size={20} /> Bot Manager
        </div>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="bg-[#054d44] border-0 text-white text-xs font-semibold rounded-lg outline-none p-2 cursor-pointer"
        >
          {navItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      {/* Styled Functional Sidebar Container */}
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200/70 flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          {/* Main App Title Wrapper */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-100">
            <div className="w-9 h-9 bg-[#e3f7f2] text-emerald-600 rounded-xl flex items-center justify-center">
              <Bot size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-[15px] text-slate-800 tracking-tight leading-none">WhatsApp Bot Manager</h1>
              <span className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase block mt-1">Workspace Panel</span>
            </div>
          </div>

          {/* Nav Links Stack */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#e3f7f2] text-emerald-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <IconComponent size={18} strokeWidth={isSelected ? 2.5 : 2} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel Metadata branding block */}
        <div className="space-y-3 pt-4 border-t border-slate-100 px-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-slate-400">Developed by</span>
            <span className="text-[13px] font-bold text-emerald-600">Shubhanu Chatterjee</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-500">Gateway Engine Connected</span>
          </div>
        </div>
      </div>

      {/* Primary Window Viewing Arena */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl">
        {activeTab === 'overview' && <Overview
                                        rules={rules}
                                        contacts={contacts}
                                        stats={stats}
                                        replyMode={replyMode}
                                        setReplyMode={setReplyMode}
                                      />}
        {activeTab === 'contacts' && (
          <Contacts
            contacts={contacts}
            setContacts={setContacts}
            rules={rules}
            setRules={setRules}
            showToast={(message, type = "success") => {

              setToast({
                message,
                type
              });

              setTimeout(() => {
                setToast(null);
              }, 3000);

            }}
          />
        )}
        {activeTab === 'rules' && (
          <Rules rules={rules} setRules={setRules} contacts={contacts} />
        )}
        {activeTab === 'simulator' && (
          <Simulator rules={rules} contacts={contacts} setStats={setStats} replyMode={replyMode} setReplyMode={setReplyMode} />
        )}
        {activeTab === 'inbox' && (
          <Inbox />
        )}
      </main>
    </div>
  );
}